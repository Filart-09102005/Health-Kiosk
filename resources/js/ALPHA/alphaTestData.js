/**
 * Alpha Testing question bank.
 *
 * Generated from the three Alpha Testing documents so the on-screen
 * questionnaire and the printed paperwork can never disagree:
 *   Alpha-Testing-Login&Register.txt
 *   Alpha-Testing-UserSide.txt
 *   Alpha-Testing-AdminSide.txt
 *
 * Q numbers run continuously across all three sections in document order,
 * so a comment labelled COMMENT Q84 identifies exactly one step.
 */

export const ALPHA_SECTIONS = [
    {
        "id": "login",
        "title": "Login & Register",
        "source": "Alpha-Testing-Login&Register.txt",
        "cases": [
            {
                "id": "TC-1",
                "title": "Login Page — Initial State",
                "actor": "Student / Teacher / Admin",
                "description": "What the tester should see before touching anything.",
                "steps": [
                    {
                        "q": "Q1",
                        "action": "Open the Login Page",
                        "data": "http://127.0.0.1:8000/login",
                        "expected": "Load the page and display the Sign in panel without any console or loading error",
                        "priorQ": "Q1"
                    },
                    {
                        "q": "Q2",
                        "action": "Observe which login method is active when the page opens",
                        "data": "None",
                        "expected": "Show Barcode as the default active method",
                        "legacyQ": "Q184",
                        "priorQ": "Q2"
                    }
                ],
                "priorCase": "TC-1"
            },
            {
                "id": "TC-2",
                "title": "Assistant Mode",
                "actor": "Student / Teacher / Admin",
                "description": "Checked before credential testing, because the assistant guides the whole login journey.",
                "steps": [
                    {
                        "q": "Q3",
                        "action": "Switch “Assistant Mode” ON on the Login Page",
                        "data": "Assistant ON",
                        "expected": "Enable the assistant and announce the login guidance by voice",
                        "legacyQ": "Q181",
                        "priorQ": "Q3"
                    },
                    {
                        "q": "Q4",
                        "action": "Move between the login fields with the assistant ON",
                        "data": "Assistant ON",
                        "expected": "Speak guidance that matches the field currently in focus",
                        "legacyQ": "Q182",
                        "priorQ": "Q4"
                    },
                    {
                        "q": "Q5",
                        "action": "Switch “Assistant Mode” OFF",
                        "data": "Assistant OFF",
                        "expected": "Stop the voice guidance immediately",
                        "legacyQ": "Q183",
                        "priorQ": "Q5"
                    }
                ],
                "priorCase": "TC-2"
            },
            {
                "id": "TC-3",
                "title": "Select Login Method",
                "actor": "Student / Teacher",
                "description": "The Email tab must be selected before any email login test, since the page opens on Barcode.",
                "steps": [
                    {
                        "q": "Q6",
                        "action": "Click the “Email” tab",
                        "data": "None",
                        "expected": "Switch to Email login and display the email and password fields",
                        "legacyQ": "Q185",
                        "priorQ": "Q6"
                    },
                    {
                        "step": 1,
                        "action": "Click “Barcode” on the login method selector",
                        "data": "None",
                        "expected": "Switch back to Barcode login and display the Barcode Scanner field",
                        "q": "Q7",
                        "legacyQ": "Q14",
                        "priorQ": "Q7"
                    },
                    {
                        "q": "Q8",
                        "action": "Observe the Admin Login and Student Login options on the page",
                        "data": "None",
                        "expected": "Display both options and make clear which account type each is for",
                        "legacyQ": "Q186",
                        "priorQ": "Q8"
                    }
                ],
                "priorCase": "TC-3"
            },
            {
                "id": "TC-4",
                "title": "Email Login — Field Validation",
                "actor": "Student / Teacher",
                "description": "Both credentials must be required before the system attempts to authenticate.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Click “Sign In” with both fields empty",
                        "data": "None",
                        "expected": "Display a validation message that the email and password are required",
                        "q": "Q9",
                        "legacyQ": "Q1",
                        "priorQ": "Q9"
                    },
                    {
                        "step": 2,
                        "action": "Enter an email only, then click “Sign In”",
                        "data": "hanskurveyfilart@smcbi.edu.ph",
                        "expected": "Display a validation message that the password is required",
                        "q": "Q10",
                        "legacyQ": "Q2",
                        "priorQ": "Q10"
                    },
                    {
                        "step": 3,
                        "action": "Enter a password only, then click “Sign In”",
                        "data": "Hans123!",
                        "expected": "Display a validation message that the email is required",
                        "q": "Q11",
                        "legacyQ": "Q3",
                        "priorQ": "Q11"
                    },
                    {
                        "step": 4,
                        "action": "Enter an email in an invalid format",
                        "data": "hanskurveyfilart",
                        "expected": "Display a validation message that a valid email is required",
                        "q": "Q12",
                        "legacyQ": "Q4",
                        "priorQ": "Q12"
                    },
                    {
                        "q": "Q13",
                        "action": "Attempt to submit a malformed email in full",
                        "data": "hanskurveyfilar@@smcbi",
                        "expected": "Allow an invalid address to actually reach validation — the username field currently auto-appends the domain, which prevents invalid email formats from being tested",
                        "legacyQ": "Q187",
                        "priorQ": "Q13"
                    }
                ],
                "priorCase": "TC-4"
            },
            {
                "id": "TC-5",
                "title": "Email Login — Credential Validation",
                "actor": "Student / Teacher",
                "description": "Wrong credentials must be rejected without revealing which part was wrong.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Enter a registered email with a wrong password",
                        "data": "Correct email / wrongpass",
                        "expected": "Reject the login and display an invalid-credentials message",
                        "q": "Q14",
                        "legacyQ": "Q5",
                        "priorQ": "Q14"
                    },
                    {
                        "step": 2,
                        "action": "Enter an unregistered email with any password",
                        "data": "nobody@smcbi.edu.ph / Test123!",
                        "expected": "Reject the login without revealing whether the account exists",
                        "q": "Q15",
                        "legacyQ": "Q6",
                        "priorQ": "Q15"
                    },
                    {
                        "step": 4,
                        "action": "Submit six failed logins within one minute",
                        "data": "Wrong password ×6",
                        "expected": "Block further attempts with a too-many-attempts message",
                        "q": "Q16",
                        "legacyQ": "Q8",
                        "priorQ": "Q16"
                    },
                    {
                        "q": "Q17",
                        "action": "Observe what the system does after the “Too Many Attempts.” message",
                        "data": "Wrong password ×6, then keep trying",
                        "expected": "Record the actual behaviour: whether any wait time is stated on screen, and how long the lockout really lasts before a valid login is accepted. No cooldown duration is currently displayed, so this establishes what the system actually does.",
                        "legacyQ": "Q188",
                        "priorQ": "Q17"
                    }
                ],
                "priorCase": "TC-5"
            },
            {
                "id": "TC-6",
                "title": "Successful Login",
                "actor": "Student / Teacher",
                "description": "Valid credentials must authenticate and open the User Dashboard.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Enter valid student credentials and click “Sign In”",
                        "data": "hanskurveyfilart@smcbi.edu.ph / Student123!",
                        "expected": "Display the loading indicator while verifying the credentials",
                        "q": "Q18",
                        "legacyQ": "Q9",
                        "priorQ": "Q18"
                    },
                    {
                        "step": 2,
                        "action": "Wait for authentication to finish",
                        "data": "None",
                        "expected": "Redirect the student to the User Dashboard",
                        "q": "Q19",
                        "legacyQ": "Q10",
                        "priorQ": "Q19"
                    },
                    {
                        "step": 3,
                        "action": "Observe the dashboard header after signing in",
                        "data": "None",
                        "expected": "Display the signed-in user’s own name. Judge this step on the login and session working — the kiosk session number is checked separately in the next step.",
                        "q": "Q20",
                        "legacyQ": "Q11",
                        "priorQ": "Q20"
                    },
                    {
                        "q": "Q21",
                        "action": "Look for the new Kiosk Session Number after signing in",
                        "data": "None",
                        "expected": "State where the session number is expected to appear. It is not shown anywhere at present, and the intended location is not defined by the requirements — this step establishes that location before the display itself can be judged.",
                        "legacyQ": "Q189",
                        "priorQ": "Q21"
                    }
                ],
                "priorCase": "TC-6"
            },
            {
                "id": "TC-7",
                "title": "Student / Admin Role Login Validation",
                "actor": "Student / Admin",
                "description": "The selected login mode must match the account role, and block the login when it does not.",
                "steps": [
                    {
                        "q": "Q22",
                        "action": "Sign in through Student Login using a student account",
                        "data": "Student Login + student account",
                        "expected": "Allow the login and open the User Dashboard",
                        "legacyQ": "Q190",
                        "priorQ": "Q22"
                    },
                    {
                        "q": "Q23",
                        "action": "Sign in through Student Login using an admin account",
                        "data": "Student Login + admin account",
                        "expected": "Block the login — an admin must not be admitted through Student Login",
                        "priorQ": "Q23"
                    },
                    {
                        "step": 4,
                        "action": "Sign in through Admin Login using an admin account",
                        "data": "Admin Login + admin account",
                        "expected": "Allow the login and open the Admin Dashboard",
                        "q": "Q24",
                        "legacyQ": "Q12",
                        "priorQ": "Q24"
                    },
                    {
                        "q": "Q25",
                        "action": "Sign in through Admin Login using a student account",
                        "data": "Admin Login + student account",
                        "expected": "Block the login — a student must not be admitted through Admin Login",
                        "priorQ": "Q25"
                    }
                ],
                "priorCase": "TC-7"
            },
            {
                "id": "TC-8",
                "title": "Session Behaviour",
                "actor": "Student / Teacher",
                "description": "The session must survive normal navigation while the user stays signed in.",
                "steps": [
                    {
                        "q": "Q26",
                        "action": "Refresh the browser after signing in",
                        "data": "None",
                        "expected": "Keep the user signed in and return to the dashboard",
                        "priorQ": "Q26"
                    }
                ],
                "priorCase": "TC-8"
            },
            {
                "id": "TC-9",
                "title": "Logout and Protected Pages",
                "actor": "Student / Teacher",
                "description": "Logging out must end the session and close off the pages behind it.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Navigate to the Logout function: open the Account Menu, then click “Logout”",
                        "data": "None",
                        "expected": "Display the logout confirmation",
                        "q": "Q27",
                        "legacyQ": "Q18",
                        "priorQ": "Q27"
                    },
                    {
                        "step": 2,
                        "action": "Click “Cancel” in the confirmation",
                        "data": "None",
                        "expected": "Close the confirmation and keep the user signed in",
                        "q": "Q28",
                        "legacyQ": "Q19",
                        "priorQ": "Q28"
                    },
                    {
                        "step": 3,
                        "action": "Click “Logout” and confirm",
                        "data": "None",
                        "expected": "End the session and redirect to the Login Page",
                        "q": "Q29",
                        "legacyQ": "Q20",
                        "priorQ": "Q29"
                    },
                    {
                        "step": 4,
                        "action": "Navigate directly to /user/dashboard after logging out",
                        "data": "None",
                        "expected": "Redirect back to the Login Page without displaying any data",
                        "q": "Q30",
                        "legacyQ": "Q21",
                        "priorQ": "Q30"
                    },
                    {
                        "step": 5,
                        "action": "Click the browser Back button after logging out",
                        "data": "None",
                        "expected": "Remain on the Login Page and not restore the dashboard",
                        "q": "Q31",
                        "legacyQ": "Q22",
                        "priorQ": "Q31"
                    }
                ],
                "priorCase": "TC-9"
            },
            {
                "id": "TC-10",
                "title": "Barcode Login",
                "actor": "Student / Teacher",
                "description": "Barcode login is automatic — the scanner is detected and the barcode fetched with no Sign In button.",
                "steps": [
                    {
                        "q": "Q32",
                        "action": "Select “Barcode” and observe the scanner state",
                        "data": "None",
                        "expected": "Activate the scanner and show that it is ready for input",
                        "legacyQ": "Q191",
                        "priorQ": "Q32"
                    },
                    {
                        "q": "Q33",
                        "action": "Scan a barcode without pressing anything else",
                        "data": "Registered barcode",
                        "expected": "Detect and fetch the barcode automatically, then identify the account",
                        "legacyQ": "Q192",
                        "priorQ": "Q33"
                    },
                    {
                        "step": 3,
                        "action": "Scan an unregistered barcode",
                        "data": "Unknown barcode",
                        "expected": "Reject the login with an account-not-found message",
                        "q": "Q34",
                        "legacyQ": "Q16",
                        "priorQ": "Q34"
                    },
                    {
                        "step": 2,
                        "action": "Scan a registered student ID barcode",
                        "data": "Registered barcode",
                        "expected": "Sign in the matching account and open the User Dashboard",
                        "q": "Q35",
                        "legacyQ": "Q15",
                        "priorQ": "Q35"
                    }
                ],
                "priorCase": "TC-10"
            },
            {
                "id": "TC-11",
                "title": "Create One — Open Registration",
                "actor": "Student / Teacher",
                "description": "Reaching the registration flow from the Login Page.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Click “Create One” on the Login Page",
                        "data": "None",
                        "expected": "Open the registration flow at Step 1",
                        "q": "Q36",
                        "legacyQ": "Q23",
                        "priorQ": "Q36"
                    }
                ],
                "priorCase": "TC-11"
            },
            {
                "id": "TC-12",
                "title": "Registration — Step 1 Barcode Validation",
                "actor": "Student / Teacher",
                "description": "Registration begins by scanning a barcode; it cannot be typed.",
                "steps": [
                    {
                        "q": "Q37",
                        "action": "Attempt to type a barcode by hand at Step 1",
                        "data": "Typed text",
                        "expected": "Prevent manual entry — the barcode must be scanned",
                        "legacyQ": "Q193",
                        "priorQ": "Q37"
                    },
                    {
                        "q": "Q38",
                        "action": "Scan a barcode that is already registered",
                        "data": "C-230204",
                        "expected": "Show Scanner Active, the scanned barcode, and “This barcode is already registered.”",
                        "legacyQ": "Q194",
                        "priorQ": "Q38"
                    },
                    {
                        "q": "Q39",
                        "action": "Scan a barcode that is not yet registered",
                        "data": "ABC-abc-1234",
                        "expected": "Show Scanner Active, the scanned barcode, and “Barcode is available.”",
                        "legacyQ": "Q195",
                        "priorQ": "Q39"
                    }
                ],
                "priorCase": "TC-12"
            },
            {
                "id": "TC-13",
                "title": "Registration — Step 2 Role Selection",
                "actor": "Student / Teacher",
                "description": "Choosing the account role after the barcode is accepted.",
                "steps": [
                    {
                        "q": "Q40",
                        "action": "Continue to Step 2 and choose a role",
                        "data": "Student",
                        "expected": "Accept the role and continue to Step 3",
                        "legacyQ": "Q196",
                        "priorQ": "Q40"
                    }
                ],
                "priorCase": "TC-13"
            },
            {
                "id": "TC-14",
                "title": "Registration — Step 3 Account Details",
                "actor": "Student / Teacher",
                "description": "Required account details must be complete before the flow continues.",
                "steps": [
                    {
                        "q": "Q41",
                        "action": "Continue from Step 3 with required account details left empty",
                        "data": "Blank fields",
                        "expected": "Block the step and require the missing details before continuing",
                        "legacyQ": "Q197",
                        "priorQ": "Q41"
                    },
                    {
                        "q": "Q42",
                        "action": "Complete Step 3 with valid account details",
                        "data": "Name, school email, department",
                        "expected": "Accept the details and continue to Step 4",
                        "legacyQ": "Q198",
                        "priorQ": "Q42"
                    }
                ],
                "priorCase": "TC-14"
            },
            {
                "id": "TC-15",
                "title": "Registration — Step 4 Password Validation",
                "actor": "Student / Teacher",
                "description": "Password rules: 8 characters, uppercase, lowercase, number, special character.",
                "steps": [
                    {
                        "q": "Q43",
                        "action": "Enter a password that breaks the rules, then one that meets every rule",
                        "data": "password  →  Hans123!",
                        "expected": "Reject the first and list what is missing (8 characters, uppercase, lowercase, number, special character), then accept the second and allow the registration to be submitted",
                        "legacyQ": "Q199",
                        "priorQ": "Q43"
                    }
                ],
                "priorCase": "TC-15"
            },
            {
                "id": "TC-16",
                "title": "Registration — Step 5 Email Verification",
                "actor": "Student / Teacher",
                "description": "From submitting the registration through to the new account signing in.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Submit the completed registration",
                        "data": "All five steps completed",
                        "expected": "Create the account and open the Health Kiosk Verification screen",
                        "q": "Q44",
                        "legacyQ": "Q28",
                        "priorQ": "Q44"
                    },
                    {
                        "q": "Q45",
                        "action": "Read the verification screen",
                        "data": "None",
                        "expected": "Show “Check your email” and that the verification email was queued, with Go to Login, Register Another Account and Resend Link available",
                        "legacyQ": "Q201",
                        "priorQ": "Q45"
                    },
                    {
                        "q": "Q46",
                        "action": "Click “Register Another Account”",
                        "data": "None",
                        "expected": "Restart the registration flow at Step 1",
                        "legacyQ": "Q203",
                        "priorQ": "Q46"
                    },
                    {
                        "q": "Q47",
                        "action": "Click “Go to Login”",
                        "data": "None",
                        "expected": "Return to the Login Page",
                        "legacyQ": "Q204",
                        "priorQ": "Q47"
                    },
                    {
                        "step": 3,
                        "action": "Attempt to sign in before verifying",
                        "data": "New account credentials",
                        "expected": "Block the login and require email verification first",
                        "q": "Q48",
                        "legacyQ": "Q30",
                        "priorQ": "Q48"
                    },
                    {
                        "step": 4,
                        "action": "Open the verification link received by email",
                        "data": "Verification link",
                        "expected": "Mark the account as verified",
                        "q": "Q49",
                        "legacyQ": "Q31",
                        "priorQ": "Q49"
                    },
                    {
                        "step": 5,
                        "action": "Sign in using the newly verified account",
                        "data": "New account credentials",
                        "expected": "Sign in successfully and open the User Dashboard",
                        "q": "Q50",
                        "legacyQ": "Q32",
                        "priorQ": "Q50"
                    },
                    {
                        "step": 6,
                        "action": "Confirm the account appears in Admin → Students",
                        "data": "None",
                        "expected": "Display the new account in the student list",
                        "q": "Q51",
                        "legacyQ": "Q33",
                        "priorQ": "Q51"
                    }
                ],
                "priorCase": "TC-16"
            },
            {
                "id": "TC-17",
                "title": "Resend Verification",
                "actor": "Student / Teacher",
                "description": "Requesting another verification email, from the verification screen and from the Login Page panel.",
                "steps": [
                    {
                        "q": "Q52",
                        "action": "Click “Resend Link” on the verification screen",
                        "data": "None",
                        "expected": "Send the verification email again and confirm it on screen",
                        "legacyQ": "Q202",
                        "priorQ": "Q52"
                    },
                    {
                        "step": 6,
                        "action": "In the Resend Verification panel, enter an email that is not registered",
                        "data": "nobody@smcbi.edu.ph",
                        "expected": "State that the email is not registered and show the grey indicator — email or account not found",
                        "q": "Q53",
                        "legacyQ": "Q39",
                        "priorQ": "Q53"
                    },
                    {
                        "q": "Q54",
                        "action": "Enter an email that is registered and already verified",
                        "data": "hanskurveyfilart@smcbi.edu.ph",
                        "expected": "Show the blue indicator — email found and already registered",
                        "legacyQ": "Q206",
                        "priorQ": "Q54"
                    },
                    {
                        "step": 7,
                        "action": "Enter an email belonging to an unverified account and send the link",
                        "data": "Unverified account email",
                        "expected": "Show the red indicator — account not yet verified — then resend the verification email and confirm it on screen",
                        "q": "Q55",
                        "legacyQ": "Q40",
                        "priorQ": "Q55"
                    }
                ],
                "priorCase": "TC-17"
            },
            {
                "id": "TC-18",
                "title": "Forgot Password",
                "actor": "Student / Teacher",
                "description": "Password recovery from the Login Page.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Click “Forgot Password” and submit an empty field",
                        "data": "None",
                        "expected": "Display a validation message that the email is required",
                        "q": "Q56",
                        "legacyQ": "Q34",
                        "priorQ": "Q56"
                    },
                    {
                        "step": 2,
                        "action": "Submit a registered email",
                        "data": "hanskurveyfilart@smcbi.edu.ph",
                        "expected": "Send the reset link and display a confirmation message",
                        "q": "Q57",
                        "legacyQ": "Q35",
                        "priorQ": "Q57"
                    },
                    {
                        "step": 3,
                        "action": "Open the reset link and set a new password",
                        "data": "NewPass123!",
                        "expected": "Update the password and redirect to the Login Page",
                        "q": "Q58",
                        "legacyQ": "Q36",
                        "priorQ": "Q58"
                    },
                    {
                        "step": 4,
                        "action": "Sign in using the old password",
                        "data": "Student123!",
                        "expected": "Reject the login",
                        "q": "Q59",
                        "legacyQ": "Q37",
                        "priorQ": "Q59"
                    },
                    {
                        "step": 5,
                        "action": "Sign in using the new password",
                        "data": "NewPass123!",
                        "expected": "Sign in successfully",
                        "q": "Q60",
                        "legacyQ": "Q38",
                        "priorQ": "Q60"
                    }
                ],
                "priorCase": "TC-18"
            }
        ],
        "finalized": true
    },
    {
        "id": "user",
        "title": "User-Side",
        "source": "Alpha-Testing-UserSide.txt",
        "cases": [
            {
                "id": "TC-1",
                "title": "User Dashboard",
                "actor": "Student / Teacher",
                "description": "Verifies that the dashboard opens a kiosk session and reflects the readings saved so far.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Sign in as a student",
                        "data": "Valid credentials",
                        "expected": "Open a kiosk session and display its session number",
                        "q": "Q1",
                        "priorQ": "Q1"
                    },
                    {
                        "step": 2,
                        "action": "View the measurement cards before measuring",
                        "data": "None",
                        "expected": "Scroll to the Recent activity cards below the hero and confirm all five (Heart Rate & SpO2, Temperature, Height, Weight, BMI) read \"--\" and show as Idle",
                        "q": "Q2",
                        "priorQ": "Q2"
                    },
                    {
                        "step": 3,
                        "action": "View the Measurement Progress panel",
                        "data": "None",
                        "expected": "Display 0 of 5 readings captured",
                        "q": "Q3",
                        "priorQ": "Q3"
                    },
                    {
                        "step": 4,
                        "action": "Click “Start Health Check”",
                        "data": "None",
                        "expected": "Open the Health Check options screen",
                        "q": "Q4",
                        "priorQ": "Q4"
                    },
                    {
                        "step": 5,
                        "action": "Save one reading and return to the dashboard",
                        "data": "Any measurement",
                        "expected": "Display the saved value on its card and increase the progress count",
                        "q": "Q5",
                        "priorQ": "Q5"
                    },
                    {
                        "step": 6,
                        "action": "Refresh the dashboard",
                        "data": "None",
                        "expected": "Reload the same session without losing any saved reading",
                        "q": "Q6",
                        "priorQ": "Q6"
                    }
                ],
                "priorCase": "TC-1"
            },
            {
                "id": "TC-2",
                "title": "Health Measurement Process (Smart Mode)",
                "actor": "Student / Teacher",
                "description": "Verifies the sensors available in Smart Mode. Only Temperature and Height are captured by sensor on this build; every measurement can be entered in Manual Mode.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Select \"Temperature\" and present the forehead to the sensor",
                        "data": "Forehead on sensor",
                        "expected": "Capture and save the temperature in °C",
                        "q": "Q7",
                        "priorQ": "Q7"
                    },
                    {
                        "step": 2,
                        "action": "Select \"Height\" and stand on the platform",
                        "data": "Student standing",
                        "expected": "Capture the height in cm with the platform thickness deducted",
                        "q": "Q8",
                        "priorQ": "Q8"
                    },
                    {
                        "step": 3,
                        "action": "View the BMI card after height and weight are saved",
                        "data": "None",
                        "expected": "Compute the BMI and display its category",
                        "q": "Q9",
                        "priorQ": "Q9"
                    },
                    {
                        "step": 4,
                        "action": "Click “Retake reading” on a completed check",
                        "data": "New reading",
                        "expected": "Replace the previous value within the same session",
                        "q": "Q10",
                        "priorQ": "Q10"
                    },
                    {
                        "step": 5,
                        "action": "Start a Smart Mode reading with the sensor unplugged",
                        "data": "None",
                        "expected": "Report the sensor as unavailable instead of saving a blank reading",
                        "q": "Q11",
                        "priorQ": "Q11"
                    }
                ],
                "priorCase": "TC-2"
            },
            {
                "id": "TC-3",
                "title": "Health Measurement Process (Manual Mode)",
                "actor": "Student / Teacher",
                "description": "Verifies manual entry and the validation applied to typed values.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Switch the mode toggle to “Manual Mode”",
                        "data": "None",
                        "expected": "Display the manual value entry fields",
                        "q": "Q12",
                        "priorQ": "Q12"
                    },
                    {
                        "step": 2,
                        "action": "Open a measurement in Manual Mode and follow the five steps in order",
                        "data": "Step 1 of 5",
                        "expected": "Move through Instructions, Positioning, Manual Entry, Result and Save in that order, showing the current step (for example \"Step 1 of 5\") throughout",
                        "q": "Q13",
                        "priorQ": "Q13"
                    },
                    {
                        "step": 3,
                        "action": "Enter a non-numeric value",
                        "data": "abc",
                        "expected": "Reject the entry and require a number",
                        "q": "Q14",
                        "priorQ": "Q14"
                    },
                    {
                        "step": 4,
                        "action": "Enter a valid temperature and save",
                        "data": "36.8",
                        "expected": "Accept and save the reading to the session",
                        "q": "Q15",
                        "priorQ": "Q15"
                    },
                    {
                        "step": 5,
                        "action": "Enter an impossible temperature",
                        "data": "3.6",
                        "expected": "Reject with a message giving the acceptable range (25–45 °C)",
                        "q": "Q16",
                        "priorQ": "Q16"
                    },
                    {
                        "step": 6,
                        "action": "Enter a heart rate without SpO2",
                        "data": "80 / blank",
                        "expected": "Reject and state that SpO2 is required with heart rate",
                        "q": "Q17",
                        "priorQ": "Q17"
                    },
                    {
                        "step": 7,
                        "action": "Enter a valid heart rate and SpO2",
                        "data": "80 / 99",
                        "expected": "Accept and save both values",
                        "q": "Q18",
                        "priorQ": "Q18"
                    },
                    {
                        "step": 8,
                        "action": "Switch back to Smart Mode midway",
                        "data": "None",
                        "expected": "Change the mode without losing readings already saved",
                        "q": "Q19",
                        "priorQ": "Q19"
                    }
                ],
                "priorCase": "TC-3"
            },
            {
                "id": "TC-4",
                "title": "Measurement Status and Health Evaluation",
                "actor": "Student / Teacher",
                "description": "Verifies that readings are graded against the thresholds configured by the administrator.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Record a normal temperature",
                        "data": "36.5 °C",
                        "expected": "Grade the reading as Normal and display it in green",
                        "q": "Q20",
                        "priorQ": "Q20"
                    },
                    {
                        "step": 2,
                        "action": "Record a high temperature",
                        "data": "38.5 °C",
                        "expected": "Grade the reading as Alert and display it in red",
                        "q": "Q21",
                        "priorQ": "Q21"
                    },
                    {
                        "step": 3,
                        "action": "Record a low temperature",
                        "data": "34.0 °C",
                        "expected": "Grade the reading as Alert and display it in red",
                        "q": "Q22",
                        "priorQ": "Q22"
                    },
                    {
                        "step": 4,
                        "action": "Record an abnormal heart rate",
                        "data": "50 bpm",
                        "expected": "Grade the reading as Alert",
                        "q": "Q23",
                        "priorQ": "Q23"
                    },
                    {
                        "step": 5,
                        "action": "Record a mildly low SpO2",
                        "data": "93 %",
                        "expected": "Grade the reading as Watch / Needs Attention",
                        "q": "Q24",
                        "priorQ": "Q24"
                    },
                    {
                        "step": 6,
                        "action": "View the overall status with one abnormal reading",
                        "data": "Any abnormal value",
                        "expected": "Display the overall status as Alert rather than Normal",
                        "q": "Q25",
                        "priorQ": "Q25"
                    },
                    {
                        "step": 7,
                        "action": "Compare the dashboard card with the results screen",
                        "data": "Same reading",
                        "expected": "Display the same status in both places",
                        "q": "Q26",
                        "priorQ": "Q26"
                    }
                ],
                "priorCase": "TC-4"
            },
            {
                "id": "TC-5",
                "title": "Health Results and Summary",
                "actor": "Student / Teacher",
                "description": "Verifies the summary shown after a health check. Reach it from the account menu, or automatically once the last reading is saved.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Complete all four health checks",
                        "data": "All readings",
                        "expected": "Display the Health Summary with all five readings",
                        "q": "Q27",
                        "priorQ": "Q27"
                    },
                    {
                        "step": 2,
                        "action": "View the Overall Status section",
                        "data": "None",
                        "expected": "Display the overall status on its own, without a recommendation or advice line",
                        "q": "Q28",
                        "priorQ": "Q28"
                    },
                    {
                        "step": 3,
                        "action": "Complete every measurement and watch what happens next",
                        "data": "All four health checks",
                        "expected": "Proceed to the Health Summary automatically once the last reading is saved, showing \"Health check complete\" and the overall status",
                        "q": "Q29",
                        "priorQ": "Q29"
                    },
                    {
                        "step": 4,
                        "action": "Click \"Back to Dashboard\"",
                        "data": "None",
                        "expected": "Return to the User Dashboard with the readings intact",
                        "q": "Q30",
                        "priorQ": "Q30"
                    }
                ],
                "priorCase": "TC-5"
            },
            {
                "id": "TC-6",
                "title": "Health Reports and Receipt Printing",
                "actor": "Student / Teacher",
                "description": "Verifies that the student can print a receipt of their health result.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Click “Print Receipt” on the Results Page",
                        "data": "None",
                        "expected": "Send the health summary to the thermal printer",
                        "q": "Q31",
                        "priorQ": "Q31"
                    },
                    {
                        "step": 2,
                        "action": "Observe the button while printing",
                        "data": "None",
                        "expected": "Show a printing state and refuse a second press until the first has finished",
                        "q": "Q32",
                        "priorQ": "Q32"
                    },
                    {
                        "step": 3,
                        "action": "Examine the printed receipt",
                        "data": "None",
                        "expected": "Show the name, session number, readings, status and date",
                        "q": "Q33",
                        "priorQ": "Q33"
                    },
                    {
                        "step": 4,
                        "action": "Switch the printer off and click “Print Receipt”",
                        "data": "None",
                        "expected": "Display a printing error without losing the saved session",
                        "q": "Q34",
                        "priorQ": "Q34"
                    },
                    {
                        "step": 5,
                        "action": "Reprint the same record from Health Records",
                        "data": "Saved record",
                        "expected": "Produce the same receipt again",
                        "q": "Q35",
                        "priorQ": "Q35"
                    }
                ],
                "priorCase": "TC-6"
            },
            {
                "id": "TC-7",
                "title": "Health Records and History",
                "actor": "Student / Teacher",
                "description": "Verifies that a user can review only their own past health records.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Click “Account Menu” then “Health Records”",
                        "data": "None",
                        "expected": "Display the user’s past sessions, newest first",
                        "q": "Q36",
                        "priorQ": "Q36"
                    },
                    {
                        "step": 2,
                        "action": "Click one health record",
                        "data": "None",
                        "expected": "Display the full detail of that session, including the kiosk session number alongside the readings, school year and academic level",
                        "q": "Q37",
                        "priorQ": "Q37"
                    },
                    {
                        "step": 3,
                        "action": "Compare a record with the results screen it came from",
                        "data": "Same session",
                        "expected": "Display matching values in both places",
                        "q": "Q38",
                        "priorQ": "Q38"
                    },
                    {
                        "step": 4,
                        "action": "Open Health Records on an account with no sessions",
                        "data": "New account",
                        "expected": "Display an empty state instead of a blank panel",
                        "q": "Q39",
                        "priorQ": "Q39"
                    },
                    {
                        "step": 5,
                        "action": "Sign in as a different student and open Health Records",
                        "data": "Second account",
                        "expected": "Display only that student’s own records",
                        "q": "Q40",
                        "priorQ": "Q40"
                    }
                ],
                "priorCase": "TC-7"
            },
            {
                "id": "TC-8",
                "title": "Health Journey and School-Year Tracking",
                "actor": "Student / Teacher",
                "description": "Verifies that readings are tracked over time with the academic level recorded at the time of measurement.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Open the Health Journey view",
                        "data": "None",
                        "expected": "Display the user’s readings across time",
                        "q": "Q41",
                        "priorQ": "Q41"
                    },
                    {
                        "step": 2,
                        "action": "Observe the academic level and school year on a record",
                        "data": "4th Year College, S.Y. 2026 – 2027",
                        "expected": "Display the values recorded when the measurement was taken",
                        "q": "Q42",
                        "priorQ": "Q42"
                    },
                    {
                        "step": 3,
                        "action": "Complete a new health check and reopen the journey",
                        "data": "New reading",
                        "expected": "Add the reading to the timeline in the correct order",
                        "q": "Q43",
                        "priorQ": "Q43"
                    },
                    {
                        "step": 4,
                        "action": "View a record taken under a different year level",
                        "data": "Requires records from more than one school year or year level",
                        "expected": "Show each record under the level it was taken in. Not testable while every record belongs to the same level - note that instead of failing it",
                        "q": "Q44",
                        "priorQ": "Q44"
                    },
                    {
                        "step": 5,
                        "action": "Open the journey when only one reading exists",
                        "data": "Single record",
                        "expected": "Show that one entry with its date and value, and no empty or broken chart area",
                        "q": "Q45",
                        "priorQ": "Q45"
                    }
                ],
                "priorCase": "TC-8"
            },
            {
                "id": "TC-9",
                "title": "Notifications and Alerts",
                "actor": "Student / Teacher",
                "description": "Verifies that abnormal readings are announced to the user, stay unread until opened, and survive a logout.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Open the notification bell with all readings normal",
                        "data": "36.5 °C, 80 bpm, 99 %",
                        "expected": "Display no abnormal-reading alerts",
                        "q": "Q46",
                        "priorQ": "Q46"
                    },
                    {
                        "step": 2,
                        "action": "Record a high temperature and open the bell",
                        "data": "38.5 °C",
                        "expected": "Display a high body temperature alert naming the value",
                        "q": "Q47",
                        "priorQ": "Q47"
                    },
                    {
                        "step": 3,
                        "action": "Record a low SpO2 and open the bell",
                        "data": "93 %",
                        "expected": "Display a low oxygen saturation alert",
                        "q": "Q48",
                        "priorQ": "Q48"
                    },
                    {
                        "step": 4,
                        "action": "Open the full Notifications page",
                        "data": "None",
                        "expected": "Display the same alerts as the bell",
                        "q": "Q49",
                        "priorQ": "Q49"
                    },
                    {
                        "step": 5,
                        "action": "Record a normal reading after an abnormal one",
                        "data": "36.5 °C",
                        "expected": "Remove the previous abnormal alert for that measurement",
                        "q": "Q50",
                        "priorQ": "Q50"
                    }
                ],
                "priorCase": "TC-9"
            },
            {
                "id": "TC-10",
                "title": "User Profile and Account Settings",
                "actor": "Student / Teacher",
                "description": "Verifies profile editing and password change from the user account menu.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Open “Profile” from the account menu",
                        "data": "None",
                        "expected": "Display the user’s details, locked for editing",
                        "q": "Q51",
                        "priorQ": "Q51"
                    },
                    {
                        "step": 2,
                        "action": "Click “Edit”, change a detail and save",
                        "data": "Updated department",
                        "expected": "Save the change and display a success message",
                        "q": "Q52",
                        "priorQ": "Q52"
                    },
                    {
                        "step": 3,
                        "action": "Clear a required field and save",
                        "data": "Blank last name",
                        "expected": "Reject the change and name the required field",
                        "q": "Q53",
                        "priorQ": "Q53"
                    },
                    {
                        "step": 4,
                        "action": "Open “Change Password”",
                        "data": "None",
                        "expected": "Display the window with the password strength guide visible",
                        "q": "Q54",
                        "priorQ": "Q54"
                    },
                    {
                        "step": 5,
                        "action": "Enter a wrong current password",
                        "data": "wrongpass",
                        "expected": "Reject and state that the current password does not match",
                        "q": "Q55",
                        "priorQ": "Q55"
                    },
                    {
                        "step": 6,
                        "action": "Enter the correct current and a valid new password twice",
                        "data": "Current / NewPass123!",
                        "expected": "Update the password and confirm success",
                        "q": "Q56",
                        "priorQ": "Q56"
                    },
                    {
                        "step": 7,
                        "action": "Sign out and sign in with the new password",
                        "data": "NewPass123!",
                        "expected": "Sign in successfully",
                        "q": "Q57",
                        "priorQ": "Q57"
                    }
                ],
                "priorCase": "TC-10"
            },
            {
                "id": "TC-11",
                "title": "Other User-Side Functions",
                "actor": "Student / Teacher",
                "description": "Verifies appearance, voice assistance, and kiosk usability.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Switch the theme to Dark Mode, then Light Mode",
                        "data": "Dark / Light",
                        "expected": "Apply each theme immediately and keep the screen readable",
                        "q": "Q58",
                        "priorQ": "Q58"
                    },
                    {
                        "step": 2,
                        "action": "Refresh after changing the theme",
                        "data": "None",
                        "expected": "Keep the chosen theme",
                        "q": "Q59",
                        "priorQ": "Q59"
                    },
                    {
                        "step": 3,
                        "action": "Enable Assistant Mode and start a health check",
                        "data": "Assistant on",
                        "expected": "Announce the on-screen guidance by voice",
                        "q": "Q60",
                        "priorQ": "Q60"
                    },
                    {
                        "step": 4,
                        "action": "Disable Assistant Mode",
                        "data": "None",
                        "expected": "Stop the voice guidance immediately",
                        "q": "Q61",
                        "priorQ": "Q61"
                    },
                    {
                        "step": 5,
                        "action": "Confirm the kiosk returns to the Login Page when the session expires",
                        "data": "Leave the kiosk idle for over 2 hours (SESSION_LIFETIME is 120 minutes), then press any control",
                        "expected": "Return to the Login Page rather than showing a broken or empty screen. The session lifetime is 120 minutes.",
                        "q": "Q62",
                        "priorQ": "Q62"
                    }
                ],
                "priorCase": "TC-11"
            }
        ],
        "finalized": true
    },
    {
        "id": "admin",
        "title": "Admin-Side",
        "source": "Alpha-Testing-AdminSide.txt",
        "cases": [
            {
                "id": "TC-1",
                "title": "Admin Access Control",
                "actor": "Admin / Student",
                "description": "Verifies that only an administrator can reach the admin modules. Start signed out.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Sign in using an admin account",
                        "data": "Admin credentials",
                        "expected": "Open the Admin Dashboard with the sidebar modules listed down the left",
                        "q": "Q1",
                        "priorQ": "Q1"
                    },
                    {
                        "step": 2,
                        "action": "Signed in as a student, open /admin/dashboard",
                        "data": "Student account",
                        "expected": "Block access and display no admin data",
                        "q": "Q2",
                        "priorQ": "Q2"
                    },
                    {
                        "step": 3,
                        "action": "Signed out, open /admin/students directly",
                        "data": "None",
                        "expected": "Redirect to the Login Page without exposing data",
                        "q": "Q3",
                        "priorQ": "Q3"
                    },
                    {
                        "step": 4,
                        "action": "Signed in as admin, click each module in the sidebar in turn",
                        "data": "All modules",
                        "expected": "Open the matching admin page for every module",
                        "q": "Q4",
                        "priorQ": "Q4"
                    }
                ],
                "priorCase": "TC-1"
            },
            {
                "id": "TC-2",
                "title": "Admin Dashboard and Monitoring",
                "actor": "Admin",
                "description": "Verifies that the dashboard summarises real kiosk activity. Start at Sidebar > Dashboard.",
                "steps": [
                    {
                        "step": 1,
                        "action": "In the sidebar, click “Dashboard”",
                        "data": "None",
                        "expected": "Display the overview cards with real totals from the database",
                        "q": "Q5",
                        "priorQ": "Q5"
                    },
                    {
                        "step": 2,
                        "action": "Leave the dashboard, complete one kiosk health check as a student, then return to Sidebar > Dashboard and refresh",
                        "data": "One new reading",
                        "expected": "Raise the totals by that reading and list it in the recent records panel",
                        "q": "Q6",
                        "priorQ": "Q6"
                    }
                ],
                "priorCase": "TC-2"
            },
            {
                "id": "TC-3",
                "title": "Health Records and Kiosk Sessions",
                "actor": "Admin",
                "description": "Verifies that completed kiosk sessions are stored and viewable. Start at Sidebar > Health Records.",
                "steps": [
                    {
                        "step": 1,
                        "action": "In the sidebar, click “Health Records”",
                        "data": "None",
                        "expected": "Display saved records with student, readings, status and date",
                        "q": "Q7",
                        "priorQ": "Q7"
                    },
                    {
                        "step": 2,
                        "action": "Open the row actions on one record and click “View records”",
                        "data": "None",
                        "expected": "Open the record detail, matching what the student saw on their results screen",
                        "q": "Q8",
                        "priorQ": "Q8"
                    },
                    {
                        "step": 3,
                        "action": "Close the detail",
                        "data": "None",
                        "expected": "Return to the records list with the list unchanged",
                        "q": "Q9",
                        "priorQ": "Q9"
                    },
                    {
                        "step": 4,
                        "action": "Back on the list, set a date range filter",
                        "data": "Selected range",
                        "expected": "Display only the records inside the range",
                        "q": "Q10",
                        "priorQ": "Q10"
                    },
                    {
                        "step": 5,
                        "action": "Export the filtered records to PDF and to Excel",
                        "data": "None",
                        "expected": "Produce both files containing the records currently listed",
                        "q": "Q11",
                        "priorQ": "Q11"
                    },
                    {
                        "step": 6,
                        "action": "In the sidebar, click “Kiosk Sessions”",
                        "data": "None",
                        "expected": "Display each kiosk visit with its session number, student, status and start time",
                        "q": "Q12",
                        "priorQ": "Q12"
                    }
                ],
                "priorCase": "TC-3"
            },
            {
                "id": "TC-4",
                "title": "Data Analytics",
                "actor": "Admin",
                "description": "Verifies that analytics are computed from real records and respond to the filters. Start at Sidebar > Data Analytics.",
                "steps": [
                    {
                        "step": 1,
                        "action": "In the sidebar, click “Data Analytics”",
                        "data": "None",
                        "expected": "Display summary figures and charts built from saved records",
                        "q": "Q13",
                        "priorQ": "Q13"
                    },
                    {
                        "step": 2,
                        "action": "Set Gender to Male, apply, then set it to Female and apply",
                        "data": "Male / Female",
                        "expected": "Update the counts so the two together equal the unfiltered total",
                        "q": "Q14",
                        "priorQ": "Q14"
                    },
                    {
                        "step": 3,
                        "action": "Open the Department filter",
                        "data": "None",
                        "expected": "List only the cohorts that exist in the database, named in full — for example College Students, BED Students, NTP, College Instructors, BED Instructors",
                        "q": "Q15",
                        "priorQ": "Q15"
                    },
                    {
                        "step": 4,
                        "action": "Set Department to College Students and apply",
                        "data": "College Students",
                        "expected": "Count only College students, and leave every other cohort out",
                        "q": "Q16",
                        "priorQ": "Q16"
                    },
                    {
                        "step": 5,
                        "action": "Set a date range that contains no records and apply",
                        "data": "A past range with no visits",
                        "expected": "Display 0 for every figure and show “No analytics data found for the selected filters” with a Clear Filters action, rather than ignoring the filter",
                        "q": "Q17",
                        "priorQ": "Q17"
                    },
                    {
                        "step": 6,
                        "action": "Click “Apply Filters” and watch the panel",
                        "data": "None",
                        "expected": "Show the applying state, then confirm and update the “Showing” count",
                        "q": "Q18",
                        "priorQ": "Q18"
                    },
                    {
                        "step": 7,
                        "action": "Click “Reset”",
                        "data": "None",
                        "expected": "Clear every filter and show the full totals again",
                        "q": "Q19",
                        "priorQ": "Q19"
                    },
                    {
                        "step": 8,
                        "action": "Scroll to the academic comparison chart",
                        "data": "None",
                        "expected": "Display one bar group per grade level, strand or course, with no student counted twice",
                        "q": "Q20",
                        "priorQ": "Q20"
                    }
                ],
                "priorCase": "TC-4"
            },
            {
                "id": "TC-5",
                "title": "Health Alerts",
                "actor": "Admin",
                "description": "Verifies that abnormal readings raise alerts the clinic can act on. Start at Sidebar > Health Alerts.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Record an abnormal reading on the kiosk, then in the sidebar click “Health Alerts”",
                        "data": "38.5 °C",
                        "expected": "Display a matching alert with the correct severity and the value that caused it",
                        "q": "Q21",
                        "priorQ": "Q21"
                    },
                    {
                        "step": 2,
                        "action": "With the abnormal reading being saved, watch the admin screen you are already on",
                        "data": "Any admin page",
                        "expected": "Announce the new alert wherever the administrator is, without needing to be on the Health Alerts page",
                        "q": "Q22",
                        "priorQ": "Q22"
                    },
                    {
                        "step": 3,
                        "action": "Filter by severity, then by measurement",
                        "data": "Critical / Temperature",
                        "expected": "Display only the alerts matching the filter",
                        "q": "Q23",
                        "priorQ": "Q23"
                    },
                    {
                        "step": 4,
                        "action": "Open a pending alert and resolve it, adding a note",
                        "data": "Resolution note",
                        "expected": "Move the alert from Pending to Resolved and record the note against it",
                        "q": "Q24",
                        "priorQ": "Q24"
                    },
                    {
                        "step": 5,
                        "action": "Switch the status filter to Resolved",
                        "data": "None",
                        "expected": "List the alert just resolved and keep it out of the pending queue",
                        "q": "Q25",
                        "priorQ": "Q25"
                    },
                    {
                        "step": 6,
                        "action": "Click “Resolve All” and confirm",
                        "data": "None",
                        "expected": "Resolve every pending alert only after the confirmation is accepted",
                        "q": "Q26",
                        "priorQ": "Q26"
                    },
                    {
                        "step": 7,
                        "action": "Turn alert monitoring off in Sidebar > Settings, then record another abnormal reading",
                        "data": "Alerts disabled",
                        "expected": "Raise no new alert while the setting is off",
                        "q": "Q27",
                        "priorQ": "Q27"
                    }
                ],
                "priorCase": "TC-5"
            },
            {
                "id": "TC-6",
                "title": "Reports and Export",
                "actor": "Admin",
                "description": "Verifies report generation and export to PDF and Excel. Start at Sidebar > Reports.",
                "steps": [
                    {
                        "step": 1,
                        "action": "In the sidebar, click “Reports” without generating anything",
                        "data": "None",
                        "expected": "Display “No reports generated yet” with no results table",
                        "q": "Q28",
                        "priorQ": "Q28"
                    },
                    {
                        "step": 2,
                        "action": "Select a date range and click “Generate Report”",
                        "data": "Range covering existing records",
                        "expected": "Show progress starting at 0 % and moving forward only",
                        "q": "Q29",
                        "priorQ": "Q29"
                    },
                    {
                        "step": 3,
                        "action": "Wait for generation to finish",
                        "data": "None",
                        "expected": "Reach 100 % only when the report is ready, then list the report rows",
                        "q": "Q30",
                        "priorQ": "Q30"
                    },
                    {
                        "step": 4,
                        "action": "Check the record count on each report row",
                        "data": "None",
                        "expected": "Match the records that fall inside the selected range and filters",
                        "q": "Q31",
                        "priorQ": "Q31"
                    },
                    {
                        "step": 5,
                        "action": "Click “PDF” on the Measurement Analytics row",
                        "data": "None",
                        "expected": "Open the formatted PDF in a new tab and confirm the export when it is finished",
                        "q": "Q32",
                        "priorQ": "Q32"
                    },
                    {
                        "step": 6,
                        "action": "Click “Excel” on the same row",
                        "data": "None",
                        "expected": "Download a spreadsheet holding the same records",
                        "q": "Q33",
                        "priorQ": "Q33"
                    },
                    {
                        "step": 7,
                        "action": "Click “PDF” on a report row showing 0 records",
                        "data": "None",
                        "expected": "State that there is nothing to export instead of claiming a file was produced",
                        "q": "Q34",
                        "priorQ": "Q34"
                    }
                ],
                "priorCase": "TC-6"
            },
            {
                "id": "TC-7",
                "title": "User Management — Create and Read",
                "actor": "Admin",
                "description": "Verifies that an administrator can add an account and find it again. Start at Sidebar > User Management > Students.",
                "steps": [
                    {
                        "step": 1,
                        "action": "In the sidebar, open “User Management” then “Students”, and click “Add New Student”",
                        "data": "None",
                        "expected": "Open the account creation form with the role already fixed to STUDENT and no role dropdown to choose",
                        "q": "Q35",
                        "priorQ": "Q35"
                    },
                    {
                        "step": 2,
                        "action": "Open the Department dropdown",
                        "data": "None",
                        "expected": "Offer College Students and BED Students only, with no staff department listed",
                        "q": "Q36",
                        "priorQ": "Q36"
                    },
                    {
                        "step": 3,
                        "action": "Click “Add New Student” with the first name, birthday or gender left blank",
                        "data": "Any blank required field",
                        "expected": "Refuse to create the account and name each field that is still required",
                        "q": "Q37",
                        "priorQ": "Q37"
                    },
                    {
                        "step": 4,
                        "action": "Complete every field",
                        "data": "Name, school email, College / BSIT / 4th Year, birthday, gender, barcode",
                        "expected": "Accept the entries and work the age out from the birthday",
                        "q": "Q38",
                        "priorQ": "Q38"
                    },
                    {
                        "step": 5,
                        "action": "Click “Add New Student”",
                        "data": "None",
                        "expected": "Create the account, close the form, and add the row to the table",
                        "q": "Q39",
                        "priorQ": "Q39"
                    },
                    {
                        "step": 6,
                        "action": "Re-open the form after creating",
                        "data": "None",
                        "expected": "Display a completely blank form with nothing carried over",
                        "q": "Q40",
                        "priorQ": "Q40"
                    },
                    {
                        "step": 7,
                        "action": "Enter a value then click “Cancel”",
                        "data": "Any entry",
                        "expected": "Ask for confirmation before discarding the entry",
                        "q": "Q41",
                        "priorQ": "Q41"
                    },
                    {
                        "step": 8,
                        "action": "Search the table by name and by barcode",
                        "data": "Hans / C-230204",
                        "expected": "Display only the matching rows",
                        "q": "Q42",
                        "priorQ": "Q42"
                    },
                    {
                        "step": 9,
                        "action": "Search using a term that matches nothing",
                        "data": "zzzzzz",
                        "expected": "Display an empty state",
                        "q": "Q43",
                        "priorQ": "Q43"
                    },
                    {
                        "step": 10,
                        "action": "In the sidebar, open “User Management” then “Teachers”, and click “Add New Teacher”",
                        "data": "None",
                        "expected": "Open the form with the role already fixed to PERSONNEL, and a Department list of College Instructors, BED Instructors and NTP only",
                        "q": "Q44",
                        "priorQ": "Q44"
                    }
                ],
                "priorCase": "TC-7"
            },
            {
                "id": "TC-8",
                "title": "User Management — Update and Delete",
                "actor": "Admin",
                "description": "Verifies editing and removal of accounts. Start at Sidebar > User Management > Students.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Click “Edit” on a student and change a detail",
                        "data": "Year Level to 3rd Year",
                        "expected": "Save the change and update the row",
                        "q": "Q45",
                        "priorQ": "Q45"
                    },
                    {
                        "step": 2,
                        "action": "Create a student leaving Barcode blank, then open that account",
                        "data": "No barcode entered",
                        "expected": "Show a barcode that was generated for the account, since the kiosk needs one to scan",
                        "q": "Q46",
                        "priorQ": "Q46"
                    },
                    {
                        "step": 3,
                        "action": "Edit an unrelated field on that account, save, then re-check the barcode",
                        "data": "Any other field",
                        "expected": "Keep the same barcode and the same printed code after the edit",
                        "q": "Q47",
                        "priorQ": "Q47"
                    },
                    {
                        "step": 4,
                        "action": "Edit a College student and switch the department to BED",
                        "data": "Department to BED Students",
                        "expected": "Offer Grade Level and Strand, and clear Year Level and Program",
                        "q": "Q48",
                        "priorQ": "Q48"
                    },
                    {
                        "step": 5,
                        "action": "Click “Delete” on a test account and confirm",
                        "data": "None",
                        "expected": "Remove the row and block that account from signing in",
                        "q": "Q49",
                        "priorQ": "Q49"
                    },
                    {
                        "step": 6,
                        "action": "Click “Undo” immediately after deleting",
                        "data": "None",
                        "expected": "Restore the row and cancel the deletion",
                        "q": "Q50",
                        "priorQ": "Q50"
                    },
                    {
                        "step": 7,
                        "action": "Repeat edit and delete under Sidebar > User Management > Teachers",
                        "data": "Teacher details",
                        "expected": "Perform the same operations successfully for a teacher account",
                        "q": "Q51",
                        "priorQ": "Q51"
                    }
                ],
                "priorCase": "TC-8"
            },
            {
                "id": "TC-9",
                "title": "Activity Logs",
                "actor": "Admin",
                "description": "Verifies the audit trail of administrator actions. Start at Sidebar > Activity Logs.",
                "steps": [
                    {
                        "step": 1,
                        "action": "In the sidebar, click “Activity Logs”",
                        "data": "None",
                        "expected": "Display the audit trail with the newest entry first",
                        "q": "Q52",
                        "priorQ": "Q52"
                    },
                    {
                        "step": 2,
                        "action": "Create a user, then return to Sidebar > Activity Logs",
                        "data": "New account",
                        "expected": "Record the action with the administrator who did it and the time",
                        "q": "Q53",
                        "priorQ": "Q53"
                    },
                    {
                        "step": 3,
                        "action": "Delete a test account and refresh the logs",
                        "data": "None",
                        "expected": "Record the deletion, naming the affected account",
                        "q": "Q54",
                        "priorQ": "Q54"
                    }
                ],
                "priorCase": "TC-9"
            },
            {
                "id": "TC-10",
                "title": "System Settings and Health Thresholds",
                "actor": "Admin",
                "description": "Verifies that threshold and kiosk settings save and take effect. Start at Sidebar > Settings.",
                "steps": [
                    {
                        "step": 1,
                        "action": "In the sidebar, click “Settings”",
                        "data": "None",
                        "expected": "Display Health Thresholds, Measurement Availability, Alert Settings and Kiosk Preferences",
                        "q": "Q55",
                        "priorQ": "Q55"
                    },
                    {
                        "step": 2,
                        "action": "Change the temperature range and click “Save health thresholds”",
                        "data": "35 – 37.2 °C",
                        "expected": "Save the values and keep them after a reload",
                        "q": "Q56",
                        "priorQ": "Q56"
                    },
                    {
                        "step": 3,
                        "action": "Narrow the range so an existing record now falls outside it, then open that record",
                        "data": "Narrowed range",
                        "expected": "Grade the same reading as Alert, notify that student, and raise the alert for the clinic",
                        "q": "Q57",
                        "priorQ": "Q57"
                    },
                    {
                        "step": 4,
                        "action": "Save the Kiosk Preferences section only",
                        "data": "Platform offset 3 cm",
                        "expected": "Save that section and leave the other sections unchanged",
                        "q": "Q58",
                        "priorQ": "Q58"
                    },
                    {
                        "step": 5,
                        "action": "Take a Smart Mode height reading",
                        "data": "Student standing on the platform",
                        "expected": "Save the height as the raw distance minus the platform offset",
                        "q": "Q59",
                        "priorQ": "Q59"
                    },
                    {
                        "step": 6,
                        "action": "Click “Restore Defaults” in one section",
                        "data": "None",
                        "expected": "Ask for confirmation naming that section before restoring",
                        "q": "Q60",
                        "priorQ": "Q60"
                    },
                    {
                        "step": 7,
                        "action": "Turn Smart Mode off for one sensor, then reload the kiosk",
                        "data": "Temperature",
                        "expected": "Offer Manual Mode only for that check",
                        "q": "Q61",
                        "priorQ": "Q61"
                    },
                    {
                        "step": 8,
                        "action": "Attempt to turn off Manual Mode",
                        "data": "None",
                        "expected": "Keep Manual Mode available at all times",
                        "q": "Q62",
                        "priorQ": "Q62"
                    }
                ],
                "priorCase": "TC-10"
            },
            {
                "id": "TC-11",
                "title": "Cloud Sync and Companion Mobile Application",
                "actor": "Admin / Student",
                "description": "Verifies that accounts and records reach the cloud and that deletion revokes mobile access. Accounts are created at Sidebar > User Management > Students; the manual sync lives in the admin header account menu, not in the sidebar.",
                "steps": [
                    {
                        "step": 1,
                        "action": "In the sidebar, open “User Management” then “Students”, and create a student",
                        "data": "New student",
                        "expected": "Create the account and upload it to the cloud on its own in the background — nothing has to be pressed for a new account to reach the cloud",
                        "q": "Q63",
                        "priorQ": "Q63"
                    },
                    {
                        "step": 2,
                        "action": "Sign in to the companion mobile app as that student",
                        "data": "School email and default password",
                        "expected": "Sign in successfully and load the student profile",
                        "q": "Q64",
                        "priorQ": "Q64"
                    },
                    {
                        "step": 3,
                        "action": "Complete a kiosk health check for that student, then refresh the mobile app",
                        "data": "One new reading",
                        "expected": "Display the reading in the student's history",
                        "q": "Q65",
                        "priorQ": "Q65"
                    },
                    {
                        "step": 4,
                        "action": "In the admin header, open the account menu and click “Sync Users & Records”",
                        "data": "None",
                        "expected": "Report what was uploaded, or state clearly that nothing was pending",
                        "q": "Q66",
                        "priorQ": "Q66"
                    },
                    {
                        "step": 5,
                        "action": "Delete that student, then try to sign in to the mobile app again",
                        "data": "Deleted account",
                        "expected": "Refuse the sign-in and remove the student's cloud rows",
                        "q": "Q67",
                        "priorQ": "Q67"
                    },
                    {
                        "step": 6,
                        "action": "Disconnect the internet and create a student",
                        "data": "New student",
                        "expected": "Create the account locally and report the sync failure on screen rather than only in the background",
                        "q": "Q68",
                        "priorQ": "Q68"
                    }
                ],
                "priorCase": "TC-11"
            },
            {
                "id": "TC-12",
                "title": "Admin Profile and Password",
                "actor": "Admin",
                "description": "Verifies the administrator's own account management. Start at Sidebar > Profile.",
                "steps": [
                    {
                        "step": 1,
                        "action": "In the sidebar, click “Profile”",
                        "data": "None",
                        "expected": "Display the administrator account details",
                        "q": "Q69",
                        "priorQ": "Q69"
                    },
                    {
                        "step": 2,
                        "action": "Open the Change Password panel",
                        "data": "None",
                        "expected": "Display the password strength guide before anything is typed",
                        "q": "Q70",
                        "priorQ": "Q70"
                    },
                    {
                        "step": 3,
                        "action": "Type a new password",
                        "data": "Admin123!",
                        "expected": "Tick each requirement as it is met",
                        "q": "Q71",
                        "priorQ": "Q71"
                    },
                    {
                        "step": 4,
                        "action": "Enter a wrong current password and update",
                        "data": "wrongpass",
                        "expected": "Reject the change and state that the current password does not match",
                        "q": "Q72",
                        "priorQ": "Q72"
                    },
                    {
                        "step": 5,
                        "action": "Enter the correct current password and a matching new password",
                        "data": "Current / Admin123!",
                        "expected": "Update the password successfully",
                        "q": "Q73",
                        "priorQ": "Q73"
                    },
                    {
                        "step": 6,
                        "action": "Sign out and sign in with the new password",
                        "data": "Admin123!",
                        "expected": "Sign in successfully",
                        "q": "Q74",
                        "priorQ": "Q74"
                    }
                ],
                "priorCase": "TC-12"
            }
        ],
        "finalized": true
    },
    {
        "id": "mobile",
        "title": "Companion App",
        "source": "Alpha-Testing-CompanionApp.txt",
        "cases": [
            {
                "id": "TC-1",
                "title": "Sign-in and account lockout",
                "actor": "Student",
                "description": "Verifies authentication, the enumeration-safe error message and the escalating lockout ladder. Start signed out. The lockout persists to device storage, so clear app data between runs to reset it.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Launch the app while signed out",
                        "data": "Fresh install",
                        "expected": "Display the login screen with the logo, Email, Password, Sign In and “SMCBI Health Systems”",
                        "q": "Q1",
                        "priorQ": "Q1"
                    },
                    {
                        "step": 2,
                        "action": "Tap Sign In with both fields empty",
                        "data": "None",
                        "expected": "Display “Missing Fields — Please enter your email and password” and make no network call",
                        "q": "Q2",
                        "priorQ": "Q2"
                    },
                    {
                        "step": 3,
                        "action": "Enter an invalid email and any password, then tap Sign In",
                        "data": "notanemail",
                        "expected": "Display “Check your email — That does not look like a valid email address”, and do not count the attempt",
                        "q": "Q3",
                        "priorQ": "Q3"
                    },
                    {
                        "step": 4,
                        "action": "Try a non-existent email with any password, then a real email with a wrong password",
                        "data": "nobody@smcbi.edu.ph, then a real account",
                        "expected": "Refuse both with exactly the same wording — “Sign in failed / Incorrect email or password.” A difference between the two would tell an outsider which accounts exist",
                        "q": "Q4",
                        "priorQ": "Q4"
                    },
                    {
                        "step": 5,
                        "action": "Look at the password field after a failed attempt",
                        "data": "None",
                        "expected": "Clear the password field",
                        "q": "Q5",
                        "priorQ": "Q5"
                    },
                    {
                        "step": 6,
                        "action": "Fail sign-in a fourth time, then a fifth",
                        "data": "5 failures in total",
                        "expected": "Warn “1 attempt remaining before sign-in is paused” on the fourth, then lock on the fifth with “Too many attempts” and a button reading “Locked · 30s”",
                        "q": "Q6",
                        "priorQ": "Q6"
                    },
                    {
                        "step": 7,
                        "action": "While locked, look at the Sign In button, then force-quit from recents and reopen",
                        "data": "During the countdown",
                        "expected": "Show the countdown on the button, do nothing when it is tapped, and after reopening still be locked with the countdown resumed at the correct remaining time",
                        "q": "Q7",
                        "priorQ": "Q7"
                    },
                    {
                        "step": 8,
                        "action": "Wait for the countdown to reach zero",
                        "data": "None",
                        "expected": "Return the button to “Sign In” and reset the attempts to five",
                        "q": "Q8",
                        "priorQ": "Q8"
                    },
                    {
                        "step": 9,
                        "action": "Fail five more times after that first lockout",
                        "data": "Second round",
                        "expected": "Lock for 60 seconds, not 30 — the ladder runs 30, 60, 300, 900",
                        "q": "Q9",
                        "priorQ": "Q9"
                    },
                    {
                        "step": 10,
                        "action": "Sign in with correct credentials",
                        "data": "A real account",
                        "expected": "Show the loading state, open Home, and clear the lockout counter completely",
                        "q": "Q10",
                        "priorQ": "Q10"
                    }
                ],
                "priorCase": "TC-1"
            },
            {
                "id": "TC-2",
                "title": "Session persistence",
                "actor": "Student",
                "description": "Verifies that the session survives a restart. Start signed in, then close the app from recents.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Force-quit the app by swiping from recents, then reopen",
                        "data": "None",
                        "expected": "Open on Home, still signed in, with no login screen",
                        "q": "Q11",
                        "priorQ": "Q11"
                    }
                ],
                "priorCase": "TC-2"
            },
            {
                "id": "TC-3",
                "title": "Home screen",
                "actor": "Student",
                "description": "Verifies the latest summary, the live poll and the empty state. Start at the Home tab, signed in with at least one health record.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Tap the Home tab",
                        "data": "Signed in",
                        "expected": "Display Home, showing a skeleton briefly and then the content",
                        "q": "Q12",
                        "priorQ": "Q12"
                    },
                    {
                        "step": 2,
                        "action": "Inspect the header",
                        "data": "None",
                        "expected": "Display the avatar with initials, the greeting, the full name and the theme toggle",
                        "q": "Q13",
                        "priorQ": "Q13"
                    },
                    {
                        "step": 3,
                        "action": "Inspect the Latest Health Summary card and its metric tiles",
                        "data": "An account with records",
                        "expected": "Display “Health Status”, the date of the record and a status pill, above six tiles: Height in cm, Weight in kg, BMI, Heart Rate in bpm, SpO2 in %, Temperature in °C",
                        "q": "Q14",
                        "priorQ": "Q14"
                    },
                    {
                        "step": 4,
                        "action": "Check a metric that has no reading",
                        "data": "A record missing a value",
                        "expected": "Display “--” rather than 0 or a blank",
                        "q": "Q15",
                        "priorQ": "Q15"
                    },
                    {
                        "step": 5,
                        "action": "Take a kiosk measurement with Home open and visible",
                        "data": "Kiosk plus the app in the foreground",
                        "expected": "Show the new reading within about five seconds, with no skeleton flash and no spinner",
                        "q": "Q16",
                        "priorQ": "Q16"
                    },
                    {
                        "step": 6,
                        "action": "Sign in on an account with no records at all",
                        "data": "An empty account",
                        "expected": "Display “No latest summary yet” with a Refresh Data button",
                        "q": "Q17",
                        "priorQ": "Q17"
                    }
                ],
                "priorCase": "TC-3"
            },
            {
                "id": "TC-4",
                "title": "Records screen",
                "actor": "Student",
                "description": "Verifies the timeline, the grouping, the verdicts and the stat tiles. Start at the Records tab, signed in with records across more than one month.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Tap the Records tab",
                        "data": "Signed in",
                        "expected": "Display Records, showing a skeleton and then the content",
                        "q": "Q18",
                        "priorQ": "Q18"
                    },
                    {
                        "step": 2,
                        "action": "Inspect the hero card",
                        "data": "None",
                        "expected": "Display “LATEST RESULT” with NORMAL, WATCH, ALERT or NOT REVIEWED, a coloured accent bar, the total number of checks and the last-checked date",
                        "q": "Q19",
                        "priorQ": "Q19"
                    },
                    {
                        "step": 3,
                        "action": "Compare the hero verdict against the same record in the kiosk admin panel",
                        "data": "A known record",
                        "expected": "Match the clinic's verdict exactly; the app must never work out a verdict of its own",
                        "q": "Q20",
                        "priorQ": "Q20"
                    },
                    {
                        "step": 4,
                        "action": "Inspect the three stat tiles",
                        "data": "None",
                        "expected": "Display This month, Flagged and Reviewed, all numeric",
                        "q": "Q21",
                        "priorQ": "Q21"
                    },
                    {
                        "step": 5,
                        "action": "Tap the “Group by” picker",
                        "data": "None",
                        "expected": "Open a bottom sheet offering Monthly, Weekly, School Year and All, one per row, each with a count",
                        "q": "Q22",
                        "priorQ": "Q22"
                    },
                    {
                        "step": 6,
                        "action": "Select “School Year”",
                        "data": "None",
                        "expected": "Close the sheet, relabel the groups as SY 2026–2027, and show the selection on the trigger",
                        "q": "Q23",
                        "priorQ": "Q23"
                    },
                    {
                        "step": 7,
                        "action": "Inspect one record row",
                        "data": "An expanded group",
                        "expected": "Display the verdict dot, the date and time, the status badge and six readouts: Temperature, Heart Rate, SpO2, Height, Weight and BMI",
                        "q": "Q24",
                        "priorQ": "Q24"
                    }
                ],
                "priorCase": "TC-4"
            },
            {
                "id": "TC-5",
                "title": "Reading detail",
                "actor": "Student",
                "description": "Verifies the reading detail screen and its back behaviour. Start on Records with a group expanded.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Tap “View details” on a record",
                        "data": "An expanded group",
                        "expected": "Open the detail screen for that record",
                        "q": "Q25",
                        "priorQ": "Q25"
                    },
                    {
                        "step": 2,
                        "action": "Press the Android back button",
                        "data": "On the detail screen",
                        "expected": "Return to Records with the same group still expanded",
                        "q": "Q26",
                        "priorQ": "Q26"
                    }
                ],
                "priorCase": "TC-5"
            },
            {
                "id": "TC-6",
                "title": "Insights: overall status and donuts",
                "actor": "Student",
                "description": "Verifies the donuts, their interaction and the honesty of their denominators. Start at the Insights tab, signed in with reviewed records.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Tap the Insights tab",
                        "data": "Signed in",
                        "expected": "Display Insights, showing a skeleton and then the content",
                        "q": "Q27",
                        "priorQ": "Q27"
                    },
                    {
                        "step": 2,
                        "action": "Inspect the header",
                        "data": "None",
                        "expected": "Display the avatar, “HEALTH PROGRESS”, the name and the theme toggle on the right",
                        "q": "Q28",
                        "priorQ": "Q28"
                    },
                    {
                        "step": 3,
                        "action": "Inspect Overall Status",
                        "data": "None",
                        "expected": "Display “LATEST CHECK” with a coloured pill reading NORMAL, WATCH, ALERT or NOT REVIEWED",
                        "q": "Q29",
                        "priorQ": "Q29"
                    },
                    {
                        "step": 4,
                        "action": "Inspect the Overall Status donut legend",
                        "data": "None",
                        "expected": "List only NORMAL, WATCH and ALERT, with no “not reviewed” slice, since an unreviewed record is a gap in the data rather than an outcome",
                        "q": "Q30",
                        "priorQ": "Q30"
                    },
                    {
                        "step": 5,
                        "action": "Tap a legend row instead of the ring",
                        "data": "None",
                        "expected": "Behave exactly as tapping the ring does",
                        "q": "Q31",
                        "priorQ": "Q31"
                    },
                    {
                        "step": 6,
                        "action": "Inspect “What Gets Flagged”",
                        "data": "An account with flags",
                        "expected": "Display the distribution of flags by metric with percentages, and name the most common",
                        "q": "Q32",
                        "priorQ": "Q32"
                    }
                ],
                "priorCase": "TC-6"
            },
            {
                "id": "TC-7",
                "title": "Insights: period picker",
                "actor": "Student",
                "description": "Verifies the period sheet, its layout, its counts and its default state. Start on the Insights tab.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Tap the “Showing” picker and inspect the layout",
                        "data": "None",
                        "expected": "Open the “Choose a period” sheet with This Week full width at the top, then January to December, one per row and each full width",
                        "q": "Q33",
                        "priorQ": "Q33"
                    },
                    {
                        "step": 2,
                        "action": "Inspect the counts on each row",
                        "data": "None",
                        "expected": "Show the number of checks on each row, dimming months with none and marking them with a dash",
                        "q": "Q34",
                        "priorQ": "Q34"
                    },
                    {
                        "step": 3,
                        "action": "Select a month, dismiss the sheet, then reopen it",
                        "data": "For example August",
                        "expected": "Show that month active and This Week inactive, and open already scrolled to the active row so it does not have to be hunted for",
                        "q": "Q35",
                        "priorQ": "Q35"
                    }
                ],
                "priorCase": "TC-7"
            },
            {
                "id": "TC-8",
                "title": "Insights: trend charts and insufficient data",
                "actor": "Student",
                "description": "Verifies the charts, tap-to-inspect and every low-data state. Start on the Insights tab. This is the area the app is most likely to surprise a tester.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Scroll to “Vitals Over Time”",
                        "data": "On Insights",
                        "expected": "Display three stacked full-width charts: Heart Rate, Body Temperature and Oxygen (SpO2)",
                        "q": "Q36",
                        "priorQ": "Q36"
                    },
                    {
                        "step": 2,
                        "action": "Scroll to “Height, Weight & BMI”",
                        "data": "None",
                        "expected": "Display three more stacked charts",
                        "q": "Q37",
                        "priorQ": "Q37"
                    },
                    {
                        "step": 3,
                        "action": "Inspect one chart that has data",
                        "data": "A period with two or more days of readings",
                        "expected": "Show the value axis down the left, a caption naming the axis, and a change badge",
                        "q": "Q38",
                        "priorQ": "Q38"
                    },
                    {
                        "step": 4,
                        "action": "Check for overlapping content on any chart",
                        "data": "None",
                        "expected": "Keep the axis labels, plot, caption and footer separate and readable",
                        "q": "Q39",
                        "priorQ": "Q39"
                    },
                    {
                        "step": 5,
                        "action": "Tap a point on the line",
                        "data": "A chart with data",
                        "expected": "Show a detail panel above the chart with the value, the full date and the clinic's verdict, and enlarge the point",
                        "q": "Q40",
                        "priorQ": "Q40"
                    },
                    {
                        "step": 6,
                        "action": "Tap a different point",
                        "data": "Detail panel open",
                        "expected": "Switch the panel to the new reading",
                        "q": "Q41",
                        "priorQ": "Q41"
                    },
                    {
                        "step": 7,
                        "action": "Select a period with no readings at all",
                        "data": "An empty month",
                        "expected": "State “No readings this period” and name the month, with no axis and no lone dot",
                        "q": "Q42",
                        "priorQ": "Q42"
                    },
                    {
                        "step": 8,
                        "action": "Select a period with more readings than the chart can fit",
                        "data": "Ten or more separate days",
                        "expected": "Caption the chart with how many of the total are being shown",
                        "q": "Q43",
                        "priorQ": "Q43"
                    }
                ],
                "priorCase": "TC-8"
            },
            {
                "id": "TC-9",
                "title": "Profile and sign-out",
                "actor": "Student",
                "description": "Verifies the profile fields, the department filtering and signing out. Start at the Profile tab.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Tap the Profile tab",
                        "data": "Signed in",
                        "expected": "Display Profile, showing a skeleton and then the content",
                        "q": "Q44",
                        "priorQ": "Q44"
                    },
                    {
                        "step": 2,
                        "action": "Inspect the header",
                        "data": "None",
                        "expected": "Display a large avatar, the full name, a role pill and an Active or Inactive pill",
                        "q": "Q45",
                        "priorQ": "Q45"
                    },
                    {
                        "step": 3,
                        "action": "Inspect Personal Details",
                        "data": "None",
                        "expected": "Display the ID, email, age and gender, hiding empty fields rather than showing blank rows",
                        "q": "Q46",
                        "priorQ": "Q46"
                    },
                    {
                        "step": 4,
                        "action": "Inspect Academic Information on a Basic Education student",
                        "data": "A student whose department is BED",
                        "expected": "Show Grade Level and Strand, and hide Year Level and Course",
                        "q": "Q47",
                        "priorQ": "Q47"
                    },
                    {
                        "step": 5,
                        "action": "Inspect Academic Information on a College student",
                        "data": "A student whose department is COLLEGE",
                        "expected": "Show Year Level and Course, and hide Grade Level and Strand",
                        "q": "Q48",
                        "priorQ": "Q48"
                    },
                    {
                        "step": 6,
                        "action": "Tap Logout",
                        "data": "None",
                        "expected": "Ask for confirmation with a Sign out and a Stay option",
                        "q": "Q49",
                        "priorQ": "Q49"
                    },
                    {
                        "step": 7,
                        "action": "Tap “Stay”",
                        "data": "Confirmation open",
                        "expected": "Close the dialog and remain signed in",
                        "q": "Q50",
                        "priorQ": "Q50"
                    },
                    {
                        "step": 8,
                        "action": "Tap Logout, then “Sign out”",
                        "data": "None",
                        "expected": "Return to the login screen within about one to two seconds",
                        "q": "Q51",
                        "priorQ": "Q51"
                    }
                ],
                "priorCase": "TC-9"
            },
            {
                "id": "TC-10",
                "title": "Offline behaviour and error handling",
                "actor": "Student",
                "description": "Verifies that the app tells a failed request apart from an account with no data. Start on Insights with the data loaded.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Open Insights with the data loaded, then turn on airplane mode",
                        "data": "Airplane mode on",
                        "expected": "Keep the existing content on screen",
                        "q": "Q52",
                        "priorQ": "Q52"
                    },
                    {
                        "step": 2,
                        "action": "Pull to refresh while offline",
                        "data": "Airplane mode on",
                        "expected": "Show a skeleton and then an error card reading “Couldn't load your insights” with a Try Again button, never looking like an empty account",
                        "q": "Q53",
                        "priorQ": "Q53"
                    },
                    {
                        "step": 3,
                        "action": "Tap “Try Again” while still offline",
                        "data": "Airplane mode on",
                        "expected": "Show the skeleton and then the error card again, without crashing",
                        "q": "Q54",
                        "priorQ": "Q54"
                    },
                    {
                        "step": 4,
                        "action": "Turn off airplane mode, then tap “Try Again”",
                        "data": "Back online",
                        "expected": "Load the data and remove the error card",
                        "q": "Q55",
                        "priorQ": "Q55"
                    },
                    {
                        "step": 5,
                        "action": "Force-quit, then cold-start the app fully offline",
                        "data": "Airplane mode on",
                        "expected": "Open signed in, since the session is held on the device, and show the error state rather than the login screen",
                        "q": "Q56",
                        "priorQ": "Q56"
                    }
                ],
                "priorCase": "TC-10"
            },
            {
                "id": "TC-11",
                "title": "Push notifications",
                "actor": "Student",
                "description": "Verifies delivery in each app state. Use the APK, not Expo Go, with notification permission granted and send-measurement-push redeployed. Close the app by swiping from recents — Force stop makes Android block delivery by design.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Complete a kiosk measurement with the app open",
                        "data": "A Normal result",
                        "expected": "Deliver a notification reading “Measurement Complete • Status: NORMAL”",
                        "q": "Q57",
                        "priorQ": "Q58"
                    },
                    {
                        "step": 2,
                        "action": "Repeat with the screen locked",
                        "data": "None",
                        "expected": "Show the notification on the lock screen",
                        "q": "Q58",
                        "priorQ": "Q59"
                    },
                    {
                        "step": 3,
                        "action": "Tap a notification while the app is closed",
                        "data": "None",
                        "expected": "Open the app on the Records tab",
                        "q": "Q59",
                        "priorQ": "Q60"
                    }
                ],
                "priorCase": "TC-11"
            },
            {
                "id": "TC-12",
                "title": "Navigation, theme and motion",
                "actor": "Student",
                "description": "Verifies tab navigation, theming and reduce-motion. Start signed in on any tab.",
                "steps": [
                    {
                        "step": 1,
                        "action": "Inspect the bottom navigation",
                        "data": "Signed in",
                        "expected": "Show four tabs: Home, Records, Insights and Profile — three means an old build",
                        "q": "Q60",
                        "priorQ": "Q61"
                    },
                    {
                        "step": 2,
                        "action": "Tap each tab in turn",
                        "data": "None",
                        "expected": "Slide the indicator between tabs and label the active one",
                        "q": "Q61",
                        "priorQ": "Q62"
                    },
                    {
                        "step": 3,
                        "action": "Tap the theme toggle on Home",
                        "data": "None",
                        "expected": "Switch the whole app in one smooth cross-fade, with no white or black flash",
                        "q": "Q62",
                        "priorQ": "Q63"
                    }
                ],
                "priorCase": "TC-12"
            }
        ],
        "finalized": true
    }
];
