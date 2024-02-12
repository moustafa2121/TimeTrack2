## Market Scanner

### About 🛈
A web app that tracks time. It was inspired by Clockify, improves on it by implementing features that are either missing or just not implemented as I would like them to be.\

The user can create a section and subsections (akin to a what the user is currently working on, i.e. a project). The user starts the session by selecting an actionable. An actionable is the current action the user is in engaged in. For example, if the user is working on “Project 1”, the user selects that section and clicks on the “Working” actionable. The timer begins for that particular actionable, user can switch between actionables and sections.\

The session starts and ends based on the user’s choice, however, it is meant to be used as an entire workday. It should begin when the user wakes up and ends the next day at the same time (i.e. same time the user began the session). The session is maxed out at 24 hours, ending automatically.\

The purpose of it is to keep the user accountable, as the session cannot be paused (as is time in the real world). So the user is compelled to reduce the time wasted and try to maximize the work time. It helps the user to review the day (and the previous days) and how their time was allocated, noting patterns and attempting to improve efficiency.


### Built with 🔧
- DJANGO
- Bootstrap
- JavaScript/HTML/CSS

### Features 📋
- SPA
-	Responsive display
-	CRUD\
  o	User can create section, actionables\
  o	User can retrieve all sessions and their actionables for the previous 5 sessions\
  o	User can update an actionable’s name, session, details, start and end time\
  o	User can delete an actionable
-	All CRUD operations are ran async in the background (FetchAPI)
-	User can get stats of actionables between specified dates and get a .csv file for further analysis
-	Display bar time tracker


### Usage 🧮
1-	If you want to use Visual Studio, just run the .sln file, build the environment, and run the server.\
2-	Alternatively, you can just create your own virtualenv in the command line and run Django.


### Demo ⏵
![demo](https://github.com/moustafa2121/MarketScanner/blob/master/demo.gif)
