from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError


#todo: do we need a user to link everything or can we link it to each person's gdrive

#e.g. a day
class SessionTime(models.Model):
    startFrom = models.DateTimeField()
    endTo = models.DateTimeField()


#time intervals
#e.g. Work > Project1 > frontend > button1
#only 4 layers deep for the subsections
class Section(models.Model):
    name = models.CharField(max_length=50, unique=True)
    #layers start from 1
    layer = models.IntegerField(default=1,
                             validators=[MinValueValidator(1), MaxValueValidator(4)])
    parentSection = models.ForeignKey('Section', on_delete=models.SET_NULL,
                                      null=True, blank=True)

    def save(self, *args, **kwargs):
        self.clean()
        if self.parentSection != None:
            if self.parentSection.layer == 4:
                raise ValidationError("Can't have more than 4 nested sections.")
            else:
                self.layer = self.parentSection.layer + 1
        #else it is 1 by default

        super().save(*args, **kwargs)


    def getChildrenList(self):
        return list(Section.objects.filter(parentSection=self).order_by("-name"))

    def __str__(self):
        return self.name
    
#e.g. the the 20/20/20 rule
class Routine(models.Model):
    pass