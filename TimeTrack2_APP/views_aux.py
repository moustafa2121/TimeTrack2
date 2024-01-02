from django.forms import ModelForm
from .models import Section
from django import forms
from datetime import datetime, timedelta
import pytz

class SectionForm(ModelForm):
    class Meta:
        model = Section
        fields = ["name", "parentSection"]
        
        widgets = {
            "name":forms.TextInput(attrs={"placeholder":"New Section"}),
            "parentSection":forms.HiddenInput(),
        }

#writing to csv helpers
def epochToDate(epoch_milliseconds):
    seconds = epoch_milliseconds / 1000
    utc_time = datetime.utcfromtimestamp(seconds)
    utc_time = pytz.utc.localize(utc_time)
    local_time = utc_time.astimezone(pytz.timezone('Asia/Dubai'))
    return local_time.strftime('%d/%m/%Y')

def epochToTime(epoch_milliseconds):
    seconds = epoch_milliseconds / 1000
    utc_time = datetime.utcfromtimestamp(seconds)
    utc_time = pytz.utc.localize(utc_time)
    local_time = utc_time.astimezone(pytz.timezone('Asia/Dubai'))
    return local_time.strftime('%H:%M:%S')

def millisecondsToString(milliseconds):
    duration = timedelta(milliseconds=milliseconds)
    hours, remainder = divmod(duration.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return "{:02}:{:02}:{:02}".format(hours, minutes, seconds)

from datetime import datetime, timedelta

def dateToEpoch(dateArg):
    dateObj = datetime.strptime(dateArg, "%Y-%m-%d")
    startOfDay = dateObj.replace(hour=0, minute=0, second=0, microsecond=0)
    epochDiff = startOfDay - datetime.utcfromtimestamp(0)
    return int(epochDiff.total_seconds() * 1000)
