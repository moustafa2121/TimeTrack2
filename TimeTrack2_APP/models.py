from datetime import datetime
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError
from rest_framework import serializers


#todo: do we need a user to link everything or can we link it to each person's gdrive

#the session in which the user start at the start of the day and ends it by the end of the day
#it encompasses all the activities (typically in a day)
#the start and end of the day are specified by unix millis
class SessionTime(models.Model):
    startFrom = models.IntegerField(primary_key=True)
    endTo = models.IntegerField(null=True, blank=True)
    archived = models.BooleanField(default=True)

    sessionDetails = models.CharField(max_length=250, null=True, blank=True)

    def __str__(self):
        return datetime.fromtimestamp(self.startFrom/1000).date().__str__()

#section is the category that the user is working on
#a user could be working on project named Project 1 in which it will be organized as follows
#Work > WebDev > Project 1
#in which all 3 are of type Section and have parent/child relation
#up to 4 layers deep
#users can add sections and subsections
class Section(models.Model):
    name = models.CharField(max_length=50)
    sectionedLayer = models.CharField(max_length=10, blank=True, null=True, default="2");
    #layers start from 1
    layer = models.IntegerField(default=1,
                             validators=[MinValueValidator(1), MaxValueValidator(4)])
    parentSection = models.ForeignKey('Section', on_delete=models.SET_NULL,
                                      null=True, blank=True)

    archivedStatus = models.BooleanField(default=False)

    class Meta:
        ordering = ["sectionedLayer"]

    def save(self, *args, **kwargs):
        self.clean()
        if self.parentSection != None:
            if self.parentSection.layer == 4:
                raise ValidationError("Can't have more than 4 nested sections.")
            else:
                self.layer = self.parentSection.layer + 1
        #else it is 1 by default

        if self.layer == 1:
            self.sectionedLayer = str(Section.objects.filter(layer=1).count()+1)
        else:
            self.sectionedLayer = self.parentSection.sectionedLayer + "." +str(Section.objects.filter(parentSection=self.parentSection).count()+1)

        #makes sure same layer sections are name-unique
        if Section.objects.filter(layer=self.layer).filter(name__iexact=self.name).exists():
            raise ValidationError("A section with the same name on layer '%s' already exists" % self.layer)
       
            
        super().save(*args, **kwargs)
        
    def getChildrenList(self):
        return list(Section.objects.filter(parentSection=self).order_by("-name"))
    
    def __str__(self):
        return str(self.sectionedLayer) + "_" + self.name

#color choices for the actionables    
ActionableChoicesColors = [    
    ("blue", "Blue"),
    ("green", "Green"),
    ("darkgreen", "Darkgreen"),
    ("yellow", "Yellow"),
    ("red", "Red"),
    ("pink", "Pink"),
    ("orange", "Orange"),
    ("blueviolet", "Blueviolet"),
    ("darkmagenta", "Darkmagenta")
]

#choices for the actionables
#created as a Model instead of a list of tuples because they might be
#modifiable by the user in future versions
class ActionableChoices(models.Model):
    name = models.CharField(max_length=15, unique=True)
    color = models.CharField(max_length=15, choices=ActionableChoicesColors, null=False, 
                             blank=True, unique=True)
    
    def save(self, *args, **kwargs):
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name

#actionables are the actions a user can take during a section
#if, for example, a user is working on a section named Project 1
#the user can choose the actionable "Working" or "Break" depending on the current activity
#an actionable refers to the session and the section it belongs to
class Actionable(models.Model):
    currentSection = models.ForeignKey(Section, on_delete=models.PROTECT, null=True)
    currentSession = models.ForeignKey(SessionTime, on_delete=models.CASCADE, null=True)

    name = models.ForeignKey(ActionableChoices, on_delete=models.PROTECT)
    startFrom = models.IntegerField()
    endTo = models.IntegerField()

    detail = models.CharField(max_length=250, null=True)

    def __str__(self):
        return self.currentSession.__str__() +">"+self.name.name+">"+datetime.fromtimestamp(self.startFrom/1000).time().__str__()[:8]

    
class SectionSerializer(serializers.ModelSerializer):
    sectionedLayer = models.CharField(max_length=10)
    class Meta:
        fields = ["sectionedLayer",]
        model = Section

class ActionableChoicesSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=15)
    class Meta:
        fields = ["name",]
        model = ActionableChoices

class ActionableSerializer(serializers.ModelSerializer):
    currentSection = SectionSerializer(read_only=True)
    name = ActionableChoicesSerializer(read_only=True)
    class Meta:
        fields = '__all__'
        model = Actionable

#todo
#e.g. tasks to be checked when done
class ToDo(models.Model):
    sectionRef = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True);
    name = models.CharField(max_length=50)
    
    status = models.BooleanField()

    dateAdded = models.IntegerField();
    dateLastModified = models.IntegerField();
    startFrom = models.IntegerField()
    endTo = models.IntegerField()


#e.g. the the 20/20/20 rule
class Routine(models.Model):
    pass