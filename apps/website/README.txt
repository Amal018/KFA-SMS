=====================================================================
 KALALAYA FINE ARTS — WEBSITE
 Plain HTML/CSS/JavaScript + PHP. No database, no Node.js, no build step.
=====================================================================

1. FOLDER STRUCTURE
-------------------
public_html/
  index.php ............ Home
  about.php ............ About Us
  courses.php .......... Courses (categories)
  course-details.php ... Course details (?category=kids | young-artists |
                         teen-artists | professional | short-term)
  gallery.php .......... Gallery (Master's Work + Students' Work)
  student-gallery.php .. ONE page for every student (?student=<id>)
  achievements.php ..... Achievements
  events.php ........... Events (placeholder until events are announced)
  contact.php .......... Contact + enquiry form
  submit-enquiry.php ... Enquiry form handler (sends the email)
  404.php .............. "Page not found"
  includes/
    config.php ......... *** ALL EDITABLE SETTINGS ARE HERE ***
    functions.php ...... helpers (icons, escaping, structured data)
    header.php ......... shared <head>, top strip and navigation
    footer.php ......... shared footer, WhatsApp button, image viewer
    .htaccess .......... blocks direct web access to this folder
  css/style.css ........ main styles (colours are CSS variables at the top)
  css/responsive.css ... tablet / mobile rules
  js/main.js ........... menu, dropdowns, image viewer, pagination
  js/gallery.js ........ builds the student cards on gallery.php
  js/student-gallery.js  builds each student's page
  js/course-details.js . scrolls to the chosen course
  js/achievements.js ... certificate slider
  js/contact.js ........ form checks + sending without page reload
  data/students.js ..... *** ALL STUDENT DATA ***
  assets/logo/ ......... kalalaya-logo.png, favicon.png
  assets/images/ ....... hero, about, courses, gallery, achievements,
                         contact, decor (brush strokes), placeholder.svg
  assets/students/<id>/  profile + artwork images for each student
  .htaccess, robots.txt, sitemap.xml, README.txt

Why .php instead of .html?  The header and footer exist only once (in
includes/) instead of being copied into every page. Old .html links
(e.g. about.html) are redirected to the .php page by .htaccess.


2. UPLOAD TO DIRECTADMIN
------------------------
1. Unzip kalalaya-fine-arts-website.zip on your computer.
2. DirectAdmin > File Manager > domains/yourdomain.com/public_html
3. Delete the default index.html that DirectAdmin puts there (if any).
4. Upload EVERYTHING from inside the "kalalaya-fine-arts" folder
   (or upload the zip and use "Extract", then move the files up one level).
   Make sure the hidden ".htaccess" files are uploaded too.
5. Open includes/config.php and set base_url to your domain.
6. Visit your domain.

PHP 8.0 or newer is required (DirectAdmin > Select PHP version).
No database, Composer, SSH or Node.js is needed.
If the site is in a sub-folder (e.g. /kalalaya/), set 'base_path' in
config.php to '/kalalaya/' and change "ErrorDocument 404 /404.php" in
.htaccess to "/kalalaya/404.php".


3. EVERYDAY EDITS — includes/config.php
---------------------------------------
Change once, updates every page:
  phone_display / phone_link / whatsapp ... phone number
  email ................................... public email address
  address (line1, line2, city, postcode) .. address
  hours_days / hours_time ................. opening hours
  maps_url ................................ "Get Directions" link
  maps_embed_query ........................ what the embedded map shows
  social → facebook / instagram / youtube . REPLACE the placeholders
                                            ('' hides an icon)
  enquiry → recipient ..................... who receives enquiries
  enquiry → from_email .................... sender address (see section 8)
  course_options .......................... the form's course dropdown
  base_url ................................ your domain (SEO tags)

Also replace "www.kalalayafinearts.com" in robots.txt and sitemap.xml.


4. REPLACING THE LOGO AND IMAGES
--------------------------------
Logo: the logo is used as an image file only — it is never redrawn in code.
  assets/logo/kalalaya-logo.png ........ main logo (header + most footers)
  assets/logo/kalalaya-logo-white.png .. white version (pink footer on About Us)
  assets/logo/favicon.png .............. browser tab icon (square)
The current files are TEMPORARY cut-outs from the mockup PNGs. Overwrite them
with your original high-resolution files, keeping the same names. A transparent
PNG about 500px wide is ideal. No code changes are needed.

Images: overwrite any file in assets/images/ with a new one of the SAME
NAME (and the same extension). Keep the same rough shape (landscape stays
landscape). Compress photos first (e.g. squoosh.app) — aim for under 250 KB.

IMPORTANT: the current photos were cut from the design mockups and are
low resolution. Please replace them with real studio photos.
Certificates in assets/images/achievements/certificate-01.jpg … -07.jpg are
taken from the design mockup and are NOT real certificates; each shows a
"SAMPLE" tag on the page. Replace them with real scans (same names), update
the captions at the top of achievements.php, and remove the
<span class="sample-tag">Sample</span> parts.


5. HOW THE STUDENT GALLERY WORKS
--------------------------------
There is ONE page, student-gallery.php. The address decides who is shown:
  student-gallery.php?student=aaradhya  → Aaradhya's page
  student-gallery.php?student=vihaan    → Vihaan's page
The page looks up that id in data/students.js and builds the profile and
artwork grid. Gallery.php builds its student cards from the same file
(10 per page; artworks show 9 per page). An unknown id shows
"Student not found".


6. HOW TO ADD STUDENT #31
-------------------------
1. Create a folder:   assets/students/kiran/
   (lowercase, letters/numbers/hyphens only — this is the student's id)
2. Add the photo:     assets/students/kiran/profile.jpg
3. Add artwork:       assets/students/kiran/artwork-01.jpg
                      assets/students/kiran/artwork-02.jpg
                      assets/students/kiran/artwork-03.jpg
4. Open data/students.js, go to the end of the list, and add a comma after
   the last  }  then paste:

    {
        id: "kiran",
        name: "Kiran M",
        course: "Drawing",
        age: "10",
        profile: "assets/students/kiran/profile.jpg",
        description: "A focused young artist who loves pencil shading.",
        quote: "Every Line|Tells a Story",
        artworks: [
            { image: "assets/students/kiran/artwork-01.jpg", title: "Still Life", category: "Drawing" },
            { image: "assets/students/kiran/artwork-02.jpg", title: "Flowers", category: "Colouring" },
            { image: "assets/students/kiran/artwork-03.jpg", title: "Landscape", category: "Painting" }
        ]
    }

5. Upload the folder and the updated students.js. Done — Kiran appears on
   gallery.php (page 4 is created automatically) and has a page at
   student-gallery.php?student=kiran. No new HTML/PHP page is needed.

Tips: age can be "" to hide it. pronoun: "her"/"his" is optional.
To ADD ARTWORK to an existing student, add the image to their folder and
one { image, title, category } line to their "artworks" list.
To REMOVE a student, delete their { ... } block (and its comma).
If the page goes blank after an edit, a comma or quote is usually missing.

All 30 current students are FICTIONAL demo content. Use only real student
photos/names with parents' permission.


FOOTER LAYOUTS: the mockups use four footer styles, so each page chooses one
with 'footer' => '...' at the top of the page file:
  simple (Home) · pink (About Us) · full (Courses, Achievements) ·
  compact (all other pages). Links and contact details come from config.php.


7. EDITING PAGE TEXT
--------------------
Text lives in the page files (e.g. about.php). Edit the words between the
HTML tags. Course timings and syllabus are in an easy list at the top of
course-details.php. Master's artworks are listed at the top of gallery.php.
Events: replace the placeholder block in events.php.


8. CONTACT FORM — HOW IT WORKS / HOSTING SETUP
----------------------------------------------
contact.php → submit-enquiry.php → email to enquiry.recipient.
Nothing is stored in a database.
Checks: required fields, valid email/phone, length limits, course from the
list, hidden "honeypot" field, session token, minimum fill time (3 s),
60-second cool-down per visitor. PHP errors are never shown to visitors.

DirectAdmin mail notes (important):
 • Set enquiry → from_email to an address ON YOUR OWN DOMAIN,
   e.g. no-reply@yourdomain.com, and create that mailbox/forwarder in
   DirectAdmin > E-mail Accounts. Gmail/Yahoo "From" addresses are
   usually rejected or sent to spam.
 • Many hosts allow PHP mail() out of the box. If test enquiries don't
   arrive (check Spam first), switch to SMTP in config.php:
       'smtp' => ['enabled' => true, 'host' => 'mail.yourdomain.com',
                  'port' => 587, 'secure' => 'tls',
                  'username' => 'no-reply@yourdomain.com',
                  'password' => 'the mailbox password']
   (Use port 465 + 'ssl' if your host says so.) The password stays in PHP
   on the server and is never sent to the browser.
 • Adding SPF/DKIM records (DirectAdmin > DNS Management, usually
   automatic) greatly improves delivery.
 • Send a test enquiry after going live.


9. .HTACCESS
------------
Turns off folder listings, sets the 404 page, redirects .html → .php,
blocks includes/ and README.txt, adds safe security headers, caching and
compression. Each part only runs if the server supports it.
To force HTTPS after SSL is enabled, uncomment the two lines marked
"OPTIONAL". If you ever see "500 Internal Server Error" right after
upload, rename .htaccess to test, then contact your host.


10. KNOWN ITEMS TO CONFIRM
--------------------------
 • Address: the About and Contact mockups showed different addresses;
   the About one is used (config.php). Confirm.
 • Opening hours (Mon–Sat 9 AM–7 PM) taken from the Contact mockup.
 • Short-term course duration reads "Months (48 Hours)" — add the number
   of months in course-details.php.
 • Social media URLs are placeholders.
 • Fonts load from Google Fonts (Roboto Serif, Roboto, Dancing Script for
   the handwritten quotes); system fonts are used if that fails.
