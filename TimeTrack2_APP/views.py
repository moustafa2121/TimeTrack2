from django.shortcuts import render, redirect
import json
from django.core import serializers
from django.core.exceptions import ValidationError
from django.http import HttpResponseNotFound, JsonResponse
from django.contrib import messages

from .views_aux import SectionForm
from .models import Section, Actionable, ActionableChoices, SessionTime, ActionableSerializer


#todo: login decorator
#the main page
#mostly responsible for getting recent/current sessions for rendering
def homepage(request):
    if request.method == 'POST':
        return HttpResponseNotFound()
    else:
        #for used to add new sections
        sectionForm = SectionForm()        
        sections = serializers.serialize('json', Section.objects.order_by("sectionedLayer"), fields=["name", "layer", "sectionedLayer"])
        actionablesChoices = ActionableChoices.objects.all();
        
        #get the 5 most recent sessions and their actionables
        recentSessionTime = SessionTime.objects.filter(archived=True).order_by("-startFrom")[:5]
        recentSessionTimeAndActionables = []
        for i in recentSessionTime:
            actionables = [ActionableSerializer(actionable).to_representation(actionable) for actionable in Actionable.objects.filter(currentSession=i).order_by("startFrom")]
            actionables = json.dumps(actionables)
            sessionT = serializers.serialize("json", [i])
            recentSessionTimeAndActionables.append((sessionT, actionables))

        #json it
        json.dumps(recentSessionTimeAndActionables)

        #get the current session (and its actionables), if any
        currentSessionTime = SessionTime.objects.filter(archived=False)
        if len(currentSessionTime) != 0:
            currentSessionTime = currentSessionTime[0]
            actionables = [ActionableSerializer(actionable).to_representation(actionable) for actionable in Actionable.objects.filter(currentSession=currentSessionTime).order_by("startFrom")]
            actionables = json.dumps(actionables)
            sessionT = serializers.serialize("json", [currentSessionTime])
            currentSessionTimeAndActionables = [sessionT, actionables]
        else:
            currentSessionTimeAndActionables = []
        
        #render
        return render(request, "TimeTrack2_APP/index.html", {"sectionForm":sectionForm, 
                                                             "sections":sections,
                                                             "actionablesChoices":actionablesChoices,
                                                             "allSessions":recentSessionTimeAndActionables,
                                                             "currentSessionDB":currentSessionTimeAndActionables})

def updateSession(request):
    if request.method == "POST":
        sessionJson = json.loads(request.body)
        try:
            if not SessionTime.objects.filter(startFrom=sessionJson["startFrom"]).exists():#start new session
                print("no former session");
                newSession = SessionTime(startFrom=sessionJson["startFrom"], archived=False)
                newSession.save()
            else:#ending session. update the DB
                newSession = SessionTime.objects.get(startFrom=sessionJson["startFrom"])
                newSession.endTo = sessionJson["endTo"]
                newSession.archived=True
                newSession.save()
            return JsonResponse({'message': 'Session saved.'})
        except Exception as e:
            return JsonResponse({'error': 'Could not add/upodate session: '+e.__str__(), "details":"woot"}, status=500)
        except:
            return JsonResponse({'message': 'something went wrong when add/upodate the session.'}, status=400)
            
    elif request.method == 'GET':
        return HttpResponseNotFound()

#called on by fetchAPI when adding a new section
def addSection(request):
    if request.method == "POST":
        sectionJson = json.loads(request.body).get("passedSection")
        try:
            if sectionJson["addSectionFormParentValue"] != "-1":#for layer 2-4 sections
                parentSectionedLayer = sectionJson["addSectionFormParentValue"].split("_")[-1];
                parentSection = Section.objects.get(sectionedLayer=parentSectionedLayer)
            else:#for layer 1 sections
                parentSection = None

            section = Section(name=sectionJson["name"], parentSection=parentSection)
            section.save()
            sectionToSend = serializers.serialize("json", [section], fields=["name", "layer", "sectionedLayer"])
            return JsonResponse({'message': 'section saved.', "sectionToSend":sectionToSend})
        except ValidationError as e:
            print(e)
            return JsonResponse({'error': 'Could not add sections: '+e.__str__(), "details":"woot"}, status=500)
        except:
            return JsonResponse({'message': 'something went wrong when saving the section.'}, status=400)
            
    elif request.method == 'GET':
        return HttpResponseNotFound()

#called on when an actionable's life-cycle ends and saved in the DB
def addActionable(request):
    if request.method == 'POST':
        try:
            actionableJson = json.loads(request.body).get('currentActionableHolder')
            actionableChoice = ActionableChoices.objects.get(name=actionableJson["actionableName"])
            currentSection = Section.objects.get(sectionedLayer=actionableJson["currentSection"])
            currentSession = SessionTime.objects.get(startFrom=actionableJson["currentSession"])
            actionableObject = Actionable(name=actionableChoice, 
                                          startFrom=actionableJson["startFrom"],
                                          endTo=actionableJson["endTo"],
                                          currentSection=currentSection,
                                          currentSession=currentSession,
                                          detail=actionableJson["detail"])
            actionableObject.save()
            return JsonResponse({'message': 'Data saved successfully.', "pk":actionableObject.pk})
        except Exception as e:
            return JsonResponse({'message': 'something went wrong when saving the actionable.'})  
    elif request.method == 'GET':
        return HttpResponseNotFound()

#called on whenever a field of the actionable is change (After being validated in the frontend)
def updateActionable(request):
    if request.method == 'POST':
        try:
            passedActionable = json.loads(request.body)
            print(passedActionable)
            fieldUpdatedName = list(passedActionable.keys())[1]
            fieldUpdatedValue = list(passedActionable.values())[1]
            
            if fieldUpdatedName == "currentSection":
                fieldUpdatedValue = Section.objects.get(sectionedLayer=fieldUpdatedValue.split("_")[0])
            elif fieldUpdatedName == "name":
                fieldUpdatedValue = ActionableChoices.objects.get(name=fieldUpdatedValue)
            
            actionableObject = Actionable.objects.get(pk=passedActionable["pk"])
            setattr(actionableObject, fieldUpdatedName, fieldUpdatedValue)

            actionableObject.save()
            return JsonResponse({'message': 'Data updated successfully.'})
        except Exception as e:
            print("updated actionable exception: ", e)
            return JsonResponse({'message': 'something went wrong when updating the actionable.'})  
    elif request.method == 'GET':
        return HttpResponseNotFound()


def deleteActionable(request):
    if request.method == 'POST':
        try:
            passedActionable = json.loads(request.body)
            print(passedActionable)
            Actionable.objects.filter(id=passedActionable["pk"]).delete()
            return JsonResponse({'message': 'Actionable deleted successfully.'})
        except Exception as e:
            print("updated actionable exception: ", e)
            return JsonResponse({'message': 'something went wrong when deleting the actionable.'})  
    elif request.method == 'GET':
        return HttpResponseNotFound()