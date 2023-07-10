from django.forms import ModelForm
from .models import Section


class SectionForm(ModelForm):
    class Meta:
        model = Section
        fields = ["name",]


#takes a list of sections of layer 1
#prints the sections and their children in their proper level
def sectionRecursionPrint(lst, value=1, foo=print):
    if type(lst) == list and len(lst)>0:
        currentItem = lst.pop()
        foo('-'*value, currentItem.__str__())
        if len(currentItem.getChildrenList()) > 0:
            sectionRecursionPrint(currentItem.getChildrenList(), value+1)
        sectionRecursionPrint(lst, value)

def sectionRecursionIterable(lst, value=1):
    if type(lst) == list and len(lst)>0:
        currentItem = lst.pop()
        yield currentItem
        if len(currentItem.getChildrenList()) > 0:
            yield from sectionRecursionIterable(currentItem.getChildrenList(), value+1)
        yield from sectionRecursionIterable(lst, value)

def sectionRecursionIterable_string(lst, value=1, marker="-"):
    if type(lst) == list and len(lst)>0:
        currentItem = lst.pop()
        yield str(marker*value+ currentItem.__str__())
        if len(currentItem.getChildrenList()) > 0:
            yield from sectionRecursionIterable_string(currentItem.getChildrenList(), value+1, marker)
        yield from sectionRecursionIterable_string(lst, value, marker)