from django.shortcuts import render, redirect
from django.core import serializers
from django.http import HttpResponseNotFound, JsonResponse
from django.contrib import messages
import json

from .views_aux import SectionForm
from .models import Section, Actionable, ActionableChoices


#todo: login decorator
def homepage(request):
    if request.method == 'POST':
        sectionForm = SectionForm(request.POST)
        try:
            print("form valid?")
            if sectionForm.is_valid():
                print("yes")
                tmp = sectionForm.save(commit=False)
                try:
                    parentSectionedLayer = request.POST.get('addSectionFormParent')
                    parentSectionedLayer = parentSectionedLayer.split("_")[-1];
                    tmp.parentSection = Section.objects.get(sectionedLayer=parentSectionedLayer)
                    tmp.save()
                    return redirect("TimeTrack2_APP:homepage")
                except:
                    messages.error(request, "Add section form: could not get parentSection. This is unexpected")
                    return redirect("TimeTrack2_APP:homepage")
            else:
                messages.error(request, "Add section form: form is invalid. This is unexpected")
                return redirect("TimeTrack2_APP:homepage")
        except Exception as e:
            messages.error(request, "Add section form: the following exception occured: "+e.__str__())
            return redirect("TimeTrack2_APP:homepage")
                
    else:
        sectionForm = SectionForm()        
        sections = serializers.serialize('json', Section.objects.order_by("sectionedLayer"), fields=["name", "layer", "sectionedLayer"])
        actionablesChoices = ActionableChoices.objects.all();
        
        return render(request, "TimeTrack2_APP/index.html", {"sectionForm":sectionForm, 
                                                             "sections":sections,
                                                             "actionablesChoices":actionablesChoices})


def addSection(request):
    if request.method == "POST":
        pass
    elif request.method == 'GET':
        return HttpResponseNotFound()
        

#todo: add the open to modify the actionable
def addActionable(request):
    if request.method == 'POST':
        try:
            actionableJson = json.loads(request.body).get('passedLogObject')
            tmp = ActionableChoices.objects.get(name=actionableJson["actionable"])
            actionableObject = Actionable(name=tmp, startFrom=actionableJson["from"], endTo=actionableJson["to"])
            actionableObject.save()

            return JsonResponse({'message': 'Data saved successfully.'})
        except Exception as e:
            return JsonResponse({'message': 'something went wrong when saving the actionable.'})  
    elif request.method == 'GET':
        return HttpResponseNotFound()

    

#just copy stuff from the homepage view to keep clean
def addNewSection(request):
    pass

def save_name(request):
    print("save name")
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        
        print("this is save_name method: ", first_name)
        
        return JsonResponse({'message': 'Data saved successfully.'})
    
    return JsonResponse({'message': 'Invalid request method.'})