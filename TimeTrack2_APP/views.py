from django.shortcuts import render
from django.shortcuts import redirect
from django.core import serializers


from .views_aux import SectionForm, sectionRecursionPrint, sectionRecursionIterable
from .models import Section


                      
def homepage(request):
    if request.method == 'POST':
        sectionForm = SectionForm(request.POST)
        if sectionForm.is_valid():
            tmp = sectionForm.save(commit=False)
            print("got the form, name is: ", tmp.name)
            tmp.save()

        return redirect("TimeTrack2_APP:homepage")
    else:
        sectionsLayer1 = Section.objects.filter(layer=1).order_by("-name")
        sections = []
        [sections.append(i) for i in sectionRecursionIterable(list(sectionsLayer1))]
        sectionForm = SectionForm()
        
        t = serializers.serialize('json', Section.objects.all(), fields=["name", "layer"])



        
        return render(request, "TimeTrack2_APP/index.html", {"sectionForm":sectionForm, "sections":t})


   