# Brevo Email Templates & Variables

These templates outline the structure and variables required for each email type sent via n8n to Brevo.

## 1. Welcome Email (Type: `WELCOME`)
**Subject:** Welcome to {{ contact.hotel.name }}, {{ contact.guest.name }}!

**Body Snippet:**
Hi {{ contact.guest.name }},

Welcome to {{ contact.hotel.name }}! We are thrilled to have you staying with us in room {{ contact.stay.room_number }}.
If you need anything at all, reply to this email or call us at {{ contact.hotel.phone }}.

Enjoy your stay!

**Expected Variables to send from n8n Context:**
- `hotel.name`
- `hotel.phone`
- `guest.name`
- `stay.room_number`

---

## 2. Stay Satisfaction Check (Type: `STAY_CHECK`)
**Subject:** How is your stay going so far?

**Body Snippet:**
Hi {{ contact.guest.name }},

We hope you are enjoying your time at {{ contact.hotel.name }}. Please let us know how we're doing:

<a href="{{ contact.app.url }}/api/feedback?token={{ contact.stay.survey_token }}&rating=EXCELLENT">😊 Everything is great</a>
<br>
<a href="{{ contact.app.url }}/api/feedback?token={{ contact.stay.survey_token }}&rating=GOOD">🙂 It's good</a>
<br>
<a href="{{ contact.app.url }}/api/feedback?token={{ contact.stay.survey_token }}&rating=NEEDS_IMPROVEMENT">😕 Something could be better</a>
<br>
<a href="{{ contact.app.url }}/api/feedback?token={{ contact.stay.survey_token }}&rating=HELP_NEEDED">🚨 I need help</a>

**Expected Variables to send from n8n Context:**
- `app.url`
- `stay.survey_token`
- `hotel.name`
- `guest.name`

---

## 3. Negative Feedback Follow-Up (Type: `NEGATIVE_FOLLOW_UP`)
**Subject:** We're sorry to hear your stay could be better

**Body Snippet:**
Hi {{ contact.guest.name }},

Thank you for your candid feedback. Our staff at {{ contact.hotel.name }} has been immediately notified regarding room {{ contact.stay.room_number }}.
We want your stay to be perfect. Our team will reach out to you shortly, or you can call us directly at {{ contact.hotel.phone }}.

Warmly,
The Management Team

**Expected Variables to send from n8n Context:**
- `hotel.name`
- `hotel.phone`
- `guest.name`
- `stay.room_number`

---

## 4. Post-Stay Review Request (Type: `REVIEW_REQUEST`)
**Subject:** Thank you for staying at {{ contact.hotel.name }}!

**Body Snippet:**
Hi {{ contact.guest.name }},

Thank you for being our guest. We hope you had a wonderful time!
If you enjoyed your stay, we'd greatly appreciate it if you could take a moment to leave us a review on Google:

[Leave a Review]({{ contact.hotel.google_review_link }})

We hope to welcome you back soon!

**Expected Variables to send from n8n Context:**
- `hotel.name`
- `hotel.google_review_link`
- `guest.name`
