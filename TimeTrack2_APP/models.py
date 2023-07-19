from argparse import Action
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError


#todo: do we need a user to link everything or can we link it to each person's gdrive

#e.g. a day
class SessionTime(models.Model):
    startFrom = models.IntegerField()
    endTo = models.IntegerField()


#time intervals
#e.g. Work > Project1 > frontend > button1
#only 4 layers deep for the subsections
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
        if Section.objects.filter(layer=self.layer).filter(name=self.name).exists():
            raise ValidationError("A section with the same name on layer '%s' already exists" % self.layer)
       
            
        super().save(*args, **kwargs)
        
    def getChildrenList(self):
        return list(Section.objects.filter(parentSection=self).order_by("-name"))
    
    def __str__(self):
        return str(self.sectionedLayer) + "_" + self.name


#currently active section
class ActiveSections (models.model):
    section = models.ForeignKey(Section, on_delete=models.PROTECT)
    startFrom = models.IntegerField()
    endTo = models.IntegerField(primary_key=True)


#todo: set as default values
#ActionableChoices = [
#    ("WK", "Working"),
#    ("BR", "Break"),
#    ("NB", "Natural Break"),
#    ("IN", "Interrupted"),
#    ("PR", "Procrastinated"),
#    ("SL", "Sleep")
#]

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

class ActionableChoices(models.Model):
    name = models.CharField(max_length=15)
    color = models.CharField(max_length=15, choices=ActionableChoicesColors, null=False, blank=True)

    archivedStatus = models.BooleanField(default=False)

    #todo: colors and names are unique to non-archive actionables
    def save(self, *args, **kwargs):

        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Actionable(models.Model):
    name = models.ForeignKey(ActionableChoices, on_delete=models.PROTECT)
    startFrom = models.IntegerField()
    endTo = models.IntegerField(primary_key=True)


        
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