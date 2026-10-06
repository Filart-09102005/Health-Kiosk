# ALPHA-TESTING
## ALPHA TESTING

### 🧪 Admin Landing Page Testing
- **👤 Actor:** Admin
- **💻 System:** Bansalan SK Federation System with GIS Mapping and Data Analytics
- **📅 Date:** September 11,2025
- **⏰ Time:** 1:00 pm - 3:00 pm


| Step | Action | Input Test Data | Expected System Response | Pass | Fail | Comment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Click “Field for Admin Username” | Admin Username Credentials | Verify credentials username in the database | ✅ | | |
| 2 | Click “Field for Admin Password” | Admin Password Credentials | Verify credentials password in the Database | ✅ | | Should have strong password<br>forgot password need a function (Resolved) |
| 3 | Click “Sign In” | None | Redirect User to admin Landing Page | ✅ | | |

---

### 🧪 User Login Page Testing
- **👤 Actor:** User
- **💻 System:** Bansalan SK Federation System with GIS Mapping and Data Analytics
- **📅 Date:** September 11,2025
- **⏰ Time:** 10:00 am - 12:00 pm


| Step | Action | Input Test Data | Expected System Response | Pass | Fail | Comment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Click “Field for User Username” | User Username Credentials | Verify credentials username in the database | ✅ | | |
| 2 | Click “Field for User Password” | User Password Credentials | Verify credentials password in the Database | ✅ | | Password Should be Strong |
| 3 | Click “Sign In” | None | Redirect User to User Landing Page | ✅ | | |

---

### 🧪 Admin Dashboard Page Testing
- **👤 Actor:** Admin
- **💻 System:** Bansalan SK Federation System with GIS Mapping and Data Analytics
- **📅 Date:** September 11,2025
- **⏰ Time:** 10:00 am - 12:00 pm


| Step | Action | Input Test Data | Expected System Response | Pass | Fail | Comment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Click “Dashboard” | None | Display Dashboard | ✅ | | In “whats new” should have a function |
| 2 | Click “Analytics Page” | None | Information Overview, Youth Information Statistics, Age and Gender | ✅ | | In Age bracket Change Series |
| 3 | Click “Site Logs” | None | Logs Monitoring, View System Activities and User Actions | ✅ | | Site Logs should be sorted per year or every 5 years |
| 4 | Click “Refresh” | None | Refresh Logs | ✅ | | Move to right side |
| 5 | Click “Clear All” | None | Clear All Logs | ✅ | | Move to right side |

---

### 🧪 Admin Information Page Testing
- **👤 Actor:** Admin
- **💻 System:** Bansalan SK Federation System with GIS Mapping and Data Analytics
- **📅 Date:** September 11,2025
- **⏰ Time:** 10:00 am - 12:00 pm


| Step | Action | Input Test Data | Expected System Response | Pass | Fail | Comment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Click “Information” | None | Display Drop down | ✅ | | Add icon in drop down |
| 2 | Click “SK Personnel” | None | Display SK Personnel Page | ✅ | | |
| 3 | Click “Field SK Members Search Bar” | Search SK Members | Display Users Account | ✅ | | |
| 4 | Click “Add SK Member” | None | Display Add New SK Member Form | ✅ | | |
| 5 | Click “First Name Text Field” | Input Fist Name | Display First Name | ✅ | | |
| 6 | Click “Last Name Text Field” | Input Last Name | Display Last Name | ✅ | | |
| 7 | Click “Middle Name Text Field” | Input Middle Name | Display Middle Name | ✅ | | |
| 8 | Click “Suffix Text Field” | Input Suffix | Display Suffix | ✅ | | Suffix should be drop down and add open and close parenthesis for identification of suffix (jr, Sr,) |
| 9 | Click “Sex Table” | Select Sex | Display Selected Sex | ✅ | | |
| 10 | Click “Age Bracket Table” | Select Age Bracket | Display Selected Age Bracket | ✅ | | Fix Age Bracket, it should display (Age bracket) and add drop down icon to the side |
| 11 | Click “Martial Status Table” | Select Martial Status | Display Selected Martial Status | ✅ | | |
| 12 | Click “Ethnicity Table” | Select Ethnicity | Display Selected Ethnicity | ✅ | | Add drop down icon |
| 13 | Click “Email Text Field” | Input Email | Display Email | ✅ | | |
| 14 | Click “Phone Number” | Input Phone Number | Display Phone Number | ✅ | | |
| 15 | Click “Region” | Input Region | Display Region | ✅ | | The Region should be default |
| 16 | Click “Municipality” | Input municipality | Display Municipality | ✅ | | Should be default |
| 17 | Click “Barangay Table” | Select Barangay | Display Selected Barangay | ✅ | | Add drop down icon |
| 18 | Click “Purok/Zone Text Field” | Input Purok or Street | Display Purok/Zone | ✅ | | Purok should be changed to address |
| 19 | Click “Username Text Field” | Input Username | Display Username | ✅ | | |
| 20 | Click “Password” | Input Password | Display Encrypted Password | ✅ | | |
| 21 | Click “User Type Table” | Select User Type | Display Selected User Type | ✅ | | |
| 22 | Click “Account Status” | Select Account Status | Display Selected Account Status | ✅ | | |
| 23 | Click “ Cancel” | None | Cancel Input Information | ✅ | | |
| 24 | Click “ Add SK Member” | None | Add New SK Personnel | ✅ | | |
| 25 | Click “Edit” | None | Edit Information | ✅ | | |
| 26 | Click “Delete” | None | Delete SK Information | ✅ | | |
| 27 | Click “Post” | None | Display Posts Information | ✅ | | error (cannot add post) It should be fixed |
| 28 | Click “Create First Post” | None | Display “Add New Post” | ✅ | | |
| 29 | Click “Title Text field” | Input Post Title | Display Post title | ✅ | | |
| 30 | Click “Description” | Input the description of Post | Display the input Description | ✅ | | |
| 31 | Click “Choose File” | Search File Image | Display Post Image | ✅ | | |
| 32 | Click “Category” | Select Category | Display Selected Category | ✅ | | |
| 33 | Click “Priority” | Select Priority | Display Selected Priority | ✅ | | |
| 34 | Click “Choose File” | Search File | Display selected file | ✅ | | |
| 35 | Click “Cancel” | None | Cancel created Post | ✅ | | |
| 36 | Click “Save Post” | None | Saved created post | ✅ | | |
| 37 | Click “View Icon” | None | The created Post can be viewed | ✅ | | |
| 38 | Click “Download Attachment” | None | Can be view the attached file | ✅ | | |
| 39 | Click “Close” | None | Close the viewed post | ✅ | | |
| 40 | Click “Edit Icon” | None | Display the created post | ✅ | | |
| 41 | Click “Title Text field” | Input Post Title | Display Post title | ✅ | | |
| 42 | Click “Description” | Input the description of Post | Display the input Description | ✅ | | |
| 43 | Click “Choose File” | Search File Image | Display Post Image | ✅ | | |
| 44 | Click “Category” | Select Category | Display Selected Category | ✅ | | |
| 45 | Click “Priority” | Select Priority | Display Selected Priority | ✅ | | |
| 46 | Click “View Current Attachment” | None | Viewed the current attached file | ✅ | | |
| 47 | Click “Choose File” | Search file | Display the selected file | ✅ | | |
| 48 | Click “Cancel” | None | Cancel the edited Post | ✅ | | |
| 49 | Click “Update Post” | None | Update post information | ✅ | | |
| 50 | Click “delete” | None | Delete post | ✅ | | |
| 51 | Click “Event Registration” | None | Display Event management | ✅ | | Should be fixed |
| 52 | Click “Add new event” | None | Display Add new event form | ✅ | | |
| 53 | Click “ Date and Time” | Set event date | Display callendar | ✅ | | |
| 54 | Click “Title Text Field” | Input Event Title | Display Created Title | ✅ | | |
| 55 | Click “Description Text Field” | Input event Description | Display Created Description | ✅ | | |
| 56 | Click “Choose File” | Search File | Display Selected File | ✅ | | |
| 57 | Click “Organizer” | Input Event Organizer | Display Created Event Organizer | ✅ | | |
| 58 | Click “Priority” | Select Priority | Display selected priority | ✅ | | |
| 59 | Click “Choose File” | Select File | Display The selected file | ✅ | | |
| 60 | Click “Event Limit” | Input Event Limit | Display Created Event Limit | ✅ | | |
| 61 | Click “Cancel” | None | Cancel the created Event | ✅ | | |
| 62 | Click “Save Event” | None | Save Created Event | ✅ | | |
| 63 | Click “View Icon” | None | The created event can be viewed | ✅ | | |
| 64 | Click “View Program” | None | Display the program file | ✅ | | |
| 65 | Click “Close” | None | Close the viewed event | ✅ | | |
| 66 | Click “Edit Icon” | None | Display the created event | ✅ | | |
| 67 | Click “Date and Time” | Input the edited date and time | Display the edited time and date | ✅ | | |
| 68 | Click “Title” | Input Event Title | Display The Edited Event Title | ✅ | | |
| 69 | Click ”Description” | Input description | Display the description | ✅ | | |
| 70 | Click “Choose File” | Select file image | Display the edited file image | ✅ | | |
| 71 | Click “Organizer” | Input organizer | Display Organizer is | ✅ | | |
| 72 | Click “Priority” | Select Priority | Display the edited priority | ✅ | | |
| 73 | Click “ Choose File” | Select PDF File | Display the Edited PDF File | ✅ | | |
| 74 | Click “Event Limit” | Input the edited event limit | Display the edited event limit | ✅ | | |
| 75 | Click “Cancel” | None | Cancel The Created Event | ✅ | | |
| 76 | Click “ Update Event” | None | Display Updated Event | ✅ | | |
| 77 | Click “Delete Icon” | None | Display Confirmation to delete the event | ✅ | | |
| 78 | Click “ Cancel” | None | Cancel The Created Event | ✅ | | |
| 79 | Click “ Delete Event” | None | Delete The Created Event | ✅ | | |
| 80 | Click “Ethnicity” | None | Display Tribes Management | ✅ | | |
| 81 | Click “Search Bar” | Search Tribe | Display The Search Tribe | ✅ | | |
| 82 | Click “Refresh Icon” | None | Display Refresh | ✅ | | |
| 83 | Click “Add New Tribe” | None | Display New Tribe Form | ✅ | | |
| 84 | Click “Tribe Name” | Input Tribe Name | Display Tribe Name | ✅ | | |
| 85 | Click “Cancel” | None | Cancel the created new tribe form | ✅ | | |
| 86 | Click “Save Tribe” | None | Display Save Tribe | ✅ | | |
| 87 | Click “Edit Icon” | None | Display Edit Tribe Form | ✅ | | |
| 88 | Click “ Cancel” | None | Cancel The Updated Tribe | ✅ | | |
| 89 | Click “Update Tribe” | None | Display Updated Tribe | ✅ | | |
| 90 | Click “Delete” | None | Display Confirmation to delete tribes name | ✅ | | |
| 91 | Click "Previous" | None | Return to previous entries | ✅ | | |
| 92 | Click “1” | None | Display next entries | ✅ | | |
| 93 | Click “2” | None | Display next entries | ✅ | | |
| 94 | Click “3” | None | Display next entries | ✅ | | |
| 95 | Click “4” | None | Display next entries | ✅ | | |
| 96 | Click “ Next” | None | Display Next Entries | ✅ | | |

---

### 🧪 Admin User’s Page Testing
- **👤 Actor:** Admin
- **💻 System:** Bansalan SK Federation System with GIS Mapping and Data Analytics
- **📅 Date:** September 11,2025
- **⏰ Time:** 10:00 am - 12:00 pm


| Step | Action | Input Test Data | Expected System Response | Pass | Fail | Comment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Click “User’s Profile” | None | Display User’s Profile | ✅ | | The Age of users should be in bracket |
| 2 | Click “Search Field” | Search User’s Name | Display searched user | ✅ | | |
| 3 | Click “Refresh” | None | Refreshed user’s profile | ✅ | | |
| 4 | Click “View” | None | Display user profile | ✅ | | The Barangay is missing Showing (N\A) |
| 5 | Click “Back To User’s” | None | Back to user’s profile | ✅ | | |
| 6 | Click “Print Profile” | None | Display Print panel | ✅ | | |
| 7 | Click “User’s Accounts” | None | Display User’s Account Panel | ✅ | | all the features here will be transfer to SK personnel button page |
| 8 | Click “Search users” | Search user’s name | Display the searched user’s name | ✅ | | |
| 9 | Click “Refresh” | None | Refreshed User’s Accounts | ✅ | | |
| 10 | Click “All Statuses” | Select Status | Display the selected status | ✅ | | |
| 11 | Click “Locked Icon” | None | Display Warning panel | ✅ | | |
| 12 | Click “Yes, Reject it!” | None | Reject user’s account | ✅ | | |
| 13 | Click “Cancel” | None | Cancel rejection | ✅ | | |
| 14 | Click “View Icon” | None | Display User’s Details | ✅ | | In user details Barangay and birthday have no data or (N\A) |
| 15 | Click “Close” | None | Close user’s details panel | ✅ | | |
| 16 | Click “Trash Bin Icon” | None | Display Warning panel | ✅ | | |
| 17 | Click “Yes, delete it!” | None | Delete user’s account | ✅ | | |
| 18 | Click “Cancel” | None | Back to User’s Accounts Panel | ✅ | | |
| 19 | Click “Archived Account” | None | Display Archived Accounts Panel | ✅ | | The address of the personnel are missing when archived |
| 20 | Click “Search Account” | Search Name of Account | Display searched account | ✅ | | |
| 21 | Click “Refresh” | None | Refreshed Archived Account | ✅ | | |
| 22 | Click “All Statuses” | Select Status | Display selected status | ✅ | | |
| 23 | Click “View Icon” | None | Display Resident Details | ✅ | | |
| 24 | Click “Close” | None | Close resident details | ✅ | | |
| 25 | Click “Restore Icon” | None | Display Confirmation Panel | ✅ | | |
| 26 | Click “Cancel” | None | Cancel Confirmation | ✅ | | |
| 27 | Click “Yes, Restore” | None | Restore resident account | ✅ | | |

---

### 🧪 Admin Maps Page Testing
- **👤 Actor:** Admin
- **💻 System:** Bansalan SK Federation System with GIS Mapping and Data Analytics
- **📅 Date:** September 11,2025
- **⏰ Time:** 10:00 am - 12:00 pm


| Step | Action | Input Test Data | Expected System Response | Pass | Fail | Comment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Click “Youth Demographic Map” | None | Display Demographic Map | ✅ | | Remove the image in left side add transparent color in map of different barangay and maps can be hover |
| 2 | Click “Select Barangay” | Select Barangay | Display Selected Barangay | ✅ | | |
| 3 | Click “Refresh” | None | Refreshed the map | ✅ | | |
| 4 | Click “+” | None | Zoom In Map | ✅ | | |
| 5 | Click “-” | None | Zoom out Map | ✅ | | |

---

### 🧪 Admin Landing Page Testing
- **👤 Actor:** Admin
- **💻 System:** Bansalan SK Federation System with GIS Mapping and Data Analytics
- **📅 Date:** September 11,2025
- **⏰ Time:** 1:00 pm - 3:00 pm


| Step | Action | Input Test Data | Expected System Response | Pass | Fail | Comment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Click “Field for Admin Username” | User’s Username Credentials | Verify credentials username in the database | ✅ | | |
| 2 | Click “Field for User’s Password” | User’s Password Credentials | Verify credentials password in the Database | ✅ | | Should have strong password<br>- forgot password need a function |
| 3 | Click “Sign In” | None | Redirect User to User’s Landing Page | ✅ | | |

---

### 🧪 User Dashboard Page Testing
- **👤 Actor:** User
- **💻 System:** Bansalan SK Federation System with GIS Mapping and Data Analytics
- **📅 Date:** September 11,2025
- **⏰ Time:** 10:00 am - 12:00 pm


| Step | Action | Input Test Data | Expected System Response | Pass | Fail | Comment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Click “Analytics” | None | Display Analytics Panel | ✅ | | menu icon can hide if the page is in full screen |
| 2 | Click “Youth Information” | None | Display Youth Information Panel | ✅ | | In contact info add Email and Phone Icon |
| 3 | Click “Search Youth” | Search Youth | Display Searched Youth | ✅ | | |
| 4 | Click “Add Youth” | None | Display New Youth Panel | ✅ | | |
| 5 | Click “Full Name” | Input User Name | Display User Name | ✅ | | |
| 6 | Click “Age” | Input User age | Display User Age | ✅ | | |
| 7 | Click “BirthDay” | Input User BirthDay | Display User BirthDay | ✅ | | |
| 8 | Click “Civil Status” | Select Status | Display Selected Status | ✅ | | |
| 9 | Click “Classification” | Input Classification | Display selected classification | ✅ | | |
| 10 | Click “Email Address” | Input email address | Display User Email Address | ✅ | | |
| 11 | Click “Contact Number” | Input User Contact Number | Display User Contact Number | ✅ | | |
| 12 | “Click Home Address" | Input User Home Address | Display User Home Address | ✅ | | |
| 13 | Click “Select Barangay” | Select Barangay | Display Selected Baranagay | ✅ | | |
| 14 | Click “Click Educational Attainment” | Input Educational Attainment | Display Users Educational Attainment | ✅ | | |
| 15 | Click “Work Status” | Input User’s Work | Display User Work | ✅ | | |
| 16 | Check “Registered Voter ” | None | Display Checked | ✅ | | |
| 17 | Check “Attended SK Assembly” | None | Display Checked | ✅ | | |
| 18 | Click “Times Attended Assembly” | Number of User Attended Assembly | Display User number of Attended Assembly | ✅ | | |
| 19 | Click "Cancel" | None | Cancel Displayed Panel | ✅ | | |
| 20 | Click “Add Youth” | None | New Youth Added in Youth Information | ✅ | | |
| 21 | Click “Import Excel” | None | Display Import Panel | ✅ | | Add warning duplication |
| 22 | Click “Choose File” | Search File | Display Searched File | ✅ | | |
| 23 | Click “Cancel” | None | Cancel Import Panel | ✅ | | |
| 24 | Click “Import” | None | Import new File in Youth Information | ✅ | | |
| 25 | Click “Edit” | None | Display Edit Youth Panel | ✅ | | |
| 26 | Click “Full Name” | Input User Edited Name | Display User Edited Name | ✅ | | |
| 27 | Click “Age” | Input User Edited age | Display User Edited Age | ✅ | | |
| 28 | Click “BirthDay” | Input User Edited BirthDay | Display User Edited BirthDay | ✅ | | |
| 29 | Click “Civil Status” | Select Status | Display Edited Selected Status | ✅ | | |
| 30 | Click “Classification” | Input Edited Classification | Display Edited selected classification | ✅ | | |
| 31 | Click “Email Address” | Input Edited email address | Display User Edited Email Address | ✅ | | |
| 32 | Click “Contact Number” | Input User Edited Contact Number | Display User Edited Contact Number | ✅ | | |
| 33 | “Click Home Address" | Input User Edited Home Address | Display User Edited Home Address | ✅ | | |
| 34 | Click “Select Barangay” | Edit Selected Barangay | Display Selected Edited Baranagay | ✅ | | |
| 35 | Click “Click Educational Attainment” | Input Edited Educational Attainment | Display Users Edited Educational Attainment | ✅ | | |
| 36 | Click “Work Status” | Input User’s Edited Work | Display User Edited Work | ✅ | | |
| 37 | Check “Registered Voter ” | None | Display Checked | ✅ | | |
| 38 | Check “Attended SK Assembly” | None | Display Checked | ✅ | | |
| 39 | Click “Times Attended Assembly” | Edit Number of User Attended Assembly | Display User Edited number of Attended Assembly | ✅ | | |
| 40 | Click "Cancel" | None | Cancel Displayed Panel | ✅ | | |
| 41 | Click “Update Youth” | None | Youth Information is Updated | ✅ | | |
| 42 | Click “Delete” | None | Display Confirmation Panel | ✅ | | |
| 43 | Click “Cancel” | None | Cancel Confirmation | ✅ | | |
| 44 | Click “Delete” | None | Delete Youth Member | ✅ | | |

---

### 🧪 User Information Page Testing
- **👤 Actor:** User
- **💻 System:** Bansalan SK Federation System with GIS Mapping and Data Analytics
- **📅 Date:** September 11,2025
- **⏰ Time:** 10:00 am - 12:00 pm


| Step | Action | Input Test Data | Expected System Response | Pass | Fail | Comment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Click “News” | None | Display News Panel | ✅ | | |
| 2 | Click “Search News” | Search News | Display Searched News | ✅ | | |
| 3 | Click “Resfresh” | None | Refreshed News Panel | ✅ | | |
| 4 | Click “Add Post” | None | Display Add Post Panel | ✅ | | |
| 5 | Click “Title” | Input Post Title | Display New Post Title | ✅ | | |
| 6 | Click “Description” | Input Post Description | Display Post Description | ✅ | | |
| 7 | Click “Category” | Select Category | Display Selected Category | ✅ | | |
| 8 | Click “Priority” | Select Priority | Display Selected Priority | ✅ | | |
| 9 | Click “Image” | Select File | Display Selected File | ✅ | | |
| 10 | Click “Attachement” | Select File | Display Selected File | ✅ | | |
| 11 | Click “Cancel” | None | Cancel Created Post | ✅ | | |
| 12 | Click “Add Post” | None | Post will be added in News Panel | ✅ | | |
| 13 | Click “Event” | None | Display Event Panel | ✅ | | |
| 14 | Click “Search Event” | Search Event | Display Searched Event | ✅ | | |
| 15 | Click “Refresh Icon” | None | Refreshed Event Panel | ✅ | | |
| 16 | Click "Announcement" | None | Display Announcement Panel | ✅ | | |
| 17 | Click “Search Announcement” | Search Announcement | Display Searched Announcement | ✅ | | |
| 18 | Click “Refresh Icon” | None | Refreshed Announcement Panel | ✅ | | |
| 19 | Click "My Registration" | None | Display My Event Registration Panel | ✅ | | Change description to note |
| 20 | Click “Search Registration” | Search Registration | Display Searched Registration | ✅ | | |
| 21 | Click “Refresh Icon” | None | Refreshed RegistrationPanel | ✅ | | |
| 22 | Click “Register For Event” | None | Display Registration Form | ✅ | | |
| 23 | Click “Select Event” | Select Event | Display Selected Event | ✅ | | |
| 24 | Click “Additional Note” | Input Note | Display Note | ✅ | | |
| 25 | Click “Cancel” | None | Cancel Event Form | ✅ | | |
| 26 | Click “Register” | None | Your Registration Will be added in Event Registration Panel | ✅ | | |

---

**Post-Condition:**
All test cases were initiated successfully.

**Executed by:**
- JHON BRYAN J. CANTIL, MIT
- RHYVEN JAY CABALLERO
- AIDAN LLOYD DONAIRE
- JOHN ROI JULAGTING
