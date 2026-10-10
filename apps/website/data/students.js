/* =====================================================================
   KALALAYA FINE ARTS — STUDENT GALLERY DATA
   ---------------------------------------------------------------------
   This single file powers BOTH:
     • gallery.php            (the "Our Talented Students" cards)
     • student-gallery.php    (one reusable page per student via ?student=ID)

   TO ADD A NEW STUDENT (e.g. student #31):
     1. Create a folder:   assets/students/<id>/        (id = lowercase, no spaces)
     2. Add:               profile.jpg  + artwork-01.jpg, artwork-02.jpg ...
     3. Copy one object below, paste it at the END of the list, edit the values.
     That's all — no new HTML/PHP page is needed.

   FIELDS
     id          unique, URL-safe (a–z, 0–9, hyphen). Used in ?student=id
     name        display name
     course      shown under the name
     age         optional — leave "" to hide
     profile     path to the profile photo (optional: defaults to
                 assets/students/<id>/profile.jpg)
     description short introduction
     quote       optional decorative script text; use | for a line break
     pronoun     optional: "her" / "his" (defaults to "their")
     artworks    list of { image, title, category }

   NOTE: All names, ages and artworks below are FICTIONAL DEMO CONTENT.
   Students 11–30 use generated SVG placeholder artwork. Replace with real
   (parent-approved) content before launch.
   ===================================================================== */

/* eslint-disable */
window.KALALAYA_STUDENTS = [
    {
        id: "aaradhya",
        name: "Aaradhya S",
        course: "Kids Art Class",
        age: "6",
        profile: "assets/students/aaradhya/profile.jpg",
        description: "A creative and cheerful learner who loves to explore colours and bring her imagination to life through art.",
        quote: "Small Hands,|Big Imagination",
        pronoun: "her",
        artworks: [
            { image: "assets/students/aaradhya/artwork-01.jpg", title: "My Dream Home", category: "Colouring" },
            { image: "assets/students/aaradhya/artwork-02.jpg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/aaradhya/artwork-03.jpg", title: "Fruits", category: "Colouring" },
            { image: "assets/students/aaradhya/artwork-04.jpg", title: "Landscape", category: "Colouring" },
            { image: "assets/students/aaradhya/artwork-05.jpg", title: "Flower", category: "Painting" },
            { image: "assets/students/aaradhya/artwork-06.jpg", title: "Night Sky", category: "Drawing & Colouring" },
            { image: "assets/students/aaradhya/artwork-07.jpg", title: "Fish", category: "Colouring" },
            { image: "assets/students/aaradhya/artwork-08.jpg", title: "Elephant", category: "Drawing" },
            { image: "assets/students/aaradhya/artwork-09.jpg", title: "Peacock", category: "Colouring" },
            { image: "assets/students/aaradhya/artwork-10.svg", title: "Sailing Boat", category: "Painting" },
            { image: "assets/students/aaradhya/artwork-11.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/aaradhya/artwork-12.svg", title: "Little Fish", category: "Colouring" }
        ]
    },
    {
        id: "vihaan",
        name: "Vihaan K",
        course: "Drawing",
        age: "9",
        profile: "assets/students/vihaan/profile.jpg",
        description: "A focused young artist building strong drawing fundamentals through regular practice with pencil, shapes and shading.",
        quote: "Every Line|Tells a Story",
        artworks: [
            { image: "assets/students/vihaan/artwork-01.svg", title: "Autumn Tree", category: "Watercolour" },
            { image: "assets/students/vihaan/artwork-02.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/vihaan/artwork-03.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/vihaan/artwork-04.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/vihaan/artwork-05.svg", title: "Little Fish", category: "Colouring" }
        ]
    },
    {
        id: "sneha",
        name: "Sneha R",
        course: "Painting",
        age: "14",
        profile: "assets/students/sneha/profile.jpg",
        description: "An enthusiastic painter exploring colour mixing, brushwork and composition across watercolour and acrylic.",
        quote: "Colours of|My Imagination",
        artworks: [
            { image: "assets/students/sneha/artwork-01.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/sneha/artwork-02.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/sneha/artwork-03.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/sneha/artwork-04.svg", title: "Landscape", category: "Painting" },
            { image: "assets/students/sneha/artwork-05.svg", title: "Colour Study", category: "Acrylic Painting" },
            { image: "assets/students/sneha/artwork-06.svg", title: "Night City", category: "Drawing & Colouring" }
        ]
    },
    {
        id: "meera",
        name: "Meera V",
        course: "Professional Course",
        age: "18",
        profile: "assets/students/meera/profile.jpg",
        description: "A dedicated student preparing for a career in art and design through structured, technical training.",
        quote: "Skill Meets|Passion",
        artworks: [
            { image: "assets/students/meera/artwork-01.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/meera/artwork-02.svg", title: "Sailing Boat", category: "Painting" },
            { image: "assets/students/meera/artwork-03.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/meera/artwork-04.svg", title: "Mandala", category: "Mandala Art" },
            { image: "assets/students/meera/artwork-05.svg", title: "Landscape", category: "Painting" },
            { image: "assets/students/meera/artwork-06.svg", title: "Autumn Tree", category: "Watercolour" },
            { image: "assets/students/meera/artwork-07.svg", title: "Night City", category: "Drawing & Colouring" }
        ]
    },
    {
        id: "ananya",
        name: "Ananya P",
        course: "Adult Art Class",
        age: "25",
        profile: "assets/students/ananya/profile.jpg",
        description: "An adult learner who returned to art as a creative passion and enjoys experimenting with new mediums.",
        quote: "Never Too Late|to Create",
        artworks: [
            { image: "assets/students/ananya/artwork-01.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/ananya/artwork-02.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/ananya/artwork-03.svg", title: "Sailing Boat", category: "Painting" },
            { image: "assets/students/ananya/artwork-04.svg", title: "Colour Study", category: "Acrylic Painting" },
            { image: "assets/students/ananya/artwork-05.svg", title: "Mandala", category: "Mandala Art" }
        ]
    },
    {
        id: "arjun",
        name: "Arjun M",
        course: "Drawing",
        age: "11",
        profile: "assets/students/arjun/profile.jpg",
        description: "A focused young artist building strong drawing fundamentals through regular practice with pencil, shapes and shading.",
        quote: "Every Line|Tells a Story",
        artworks: [
            { image: "assets/students/arjun/artwork-01.svg", title: "My Home", category: "Colouring" },
            { image: "assets/students/arjun/artwork-02.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/arjun/artwork-03.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/arjun/artwork-04.svg", title: "Colour Study", category: "Acrylic Painting" }
        ]
    },
    {
        id: "diya",
        name: "Diya S",
        course: "Painting",
        age: "13",
        profile: "assets/students/diya/profile.jpg",
        description: "An enthusiastic painter exploring colour mixing, brushwork and composition across watercolour and acrylic.",
        quote: "Colours of|My Imagination",
        artworks: [
            { image: "assets/students/diya/artwork-01.svg", title: "Landscape", category: "Painting" },
            { image: "assets/students/diya/artwork-02.svg", title: "Autumn Tree", category: "Watercolour" },
            { image: "assets/students/diya/artwork-03.svg", title: "Sailing Boat", category: "Painting" },
            { image: "assets/students/diya/artwork-04.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/diya/artwork-05.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/diya/artwork-06.svg", title: "My Home", category: "Colouring" }
        ]
    },
    {
        id: "rohan",
        name: "Rohan T",
        course: "Fine Arts",
        age: "16",
        profile: "assets/students/rohan/profile.jpg",
        description: "A thoughtful artist developing a personal style across drawing, painting and still life studies.",
        quote: "Art is How|I See the World",
        artworks: [
            { image: "assets/students/rohan/artwork-01.svg", title: "Landscape", category: "Painting" },
            { image: "assets/students/rohan/artwork-02.svg", title: "Autumn Tree", category: "Watercolour" },
            { image: "assets/students/rohan/artwork-03.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/rohan/artwork-04.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/rohan/artwork-05.svg", title: "My Home", category: "Colouring" }
        ]
    },
    {
        id: "gayathri",
        name: "Gayathri L",
        course: "Professional Course",
        age: "20",
        profile: "assets/students/gayathri/profile.jpg",
        description: "A dedicated student preparing for a career in art and design through structured, technical training.",
        quote: "Skill Meets|Passion",
        artworks: [
            { image: "assets/students/gayathri/artwork-01.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/gayathri/artwork-02.svg", title: "Sailing Boat", category: "Painting" },
            { image: "assets/students/gayathri/artwork-03.svg", title: "My Home", category: "Colouring" },
            { image: "assets/students/gayathri/artwork-04.svg", title: "Landscape", category: "Painting" },
            { image: "assets/students/gayathri/artwork-05.svg", title: "Autumn Tree", category: "Watercolour" },
            { image: "assets/students/gayathri/artwork-06.svg", title: "Butterfly", category: "Drawing & Colouring" }
        ]
    },
    {
        id: "nithya",
        name: "Nithya V",
        course: "Short-Term Course",
        age: "22",
        profile: "assets/students/nithya/profile.jpg",
        description: "A hobby artist exploring glass painting, mandala art and other specialised forms in a short-term course.",
        quote: "Create, Learn,|Take Home",
        artworks: [
            { image: "assets/students/nithya/artwork-01.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/nithya/artwork-02.svg", title: "My Home", category: "Colouring" },
            { image: "assets/students/nithya/artwork-03.svg", title: "Landscape", category: "Painting" },
            { image: "assets/students/nithya/artwork-04.svg", title: "Colour Study", category: "Acrylic Painting" }
        ]
    },
    {
        id: "kavin",
        name: "Kavin R",
        course: "Kids Art Class",
        age: "7",
        profile: "assets/students/kavin/profile.svg",
        description: "A cheerful young learner who loves exploring colours and turning everyday ideas into bright, happy drawings.",
        quote: "Small Hands,|Big Imagination",
        artworks: [
            { image: "assets/students/kavin/artwork-01.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/kavin/artwork-02.svg", title: "Mandala", category: "Mandala Art" },
            { image: "assets/students/kavin/artwork-03.svg", title: "Little Fish", category: "Colouring" }
        ]
    },
    {
        id: "ishaan",
        name: "Ishaan P",
        course: "Drawing",
        age: "10",
        profile: "assets/students/ishaan/profile.svg",
        description: "A focused young artist building strong drawing fundamentals through regular practice with pencil, shapes and shading.",
        quote: "Every Line|Tells a Story",
        artworks: [
            { image: "assets/students/ishaan/artwork-01.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/ishaan/artwork-02.svg", title: "Mandala", category: "Mandala Art" },
            { image: "assets/students/ishaan/artwork-03.svg", title: "Sailing Boat", category: "Painting" },
            { image: "assets/students/ishaan/artwork-04.svg", title: "Fruit Bowl", category: "Still Life" }
        ]
    },
    {
        id: "harini",
        name: "Harini S",
        course: "Painting",
        age: "15",
        profile: "assets/students/harini/profile.svg",
        description: "An enthusiastic painter exploring colour mixing, brushwork and composition across watercolour and acrylic.",
        quote: "Colours of|My Imagination",
        artworks: [
            { image: "assets/students/harini/artwork-01.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/harini/artwork-02.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/harini/artwork-03.svg", title: "Landscape", category: "Painting" },
            { image: "assets/students/harini/artwork-04.svg", title: "My Home", category: "Colouring" },
            { image: "assets/students/harini/artwork-05.svg", title: "Fruit Bowl", category: "Still Life" }
        ]
    },
    {
        id: "pranav",
        name: "Pranav K",
        course: "Drawing",
        age: "12",
        profile: "assets/students/pranav/profile.svg",
        description: "A focused young artist building strong drawing fundamentals through regular practice with pencil, shapes and shading.",
        quote: "Every Line|Tells a Story",
        artworks: [
            { image: "assets/students/pranav/artwork-01.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/pranav/artwork-02.svg", title: "My Home", category: "Colouring" },
            { image: "assets/students/pranav/artwork-03.svg", title: "Mandala", category: "Mandala Art" },
            { image: "assets/students/pranav/artwork-04.svg", title: "Little Fish", category: "Colouring" }
        ]
    },
    {
        id: "lakshana",
        name: "Lakshana M",
        course: "Kids Art Class",
        age: "6",
        profile: "assets/students/lakshana/profile.svg",
        description: "A cheerful young learner who loves exploring colours and turning everyday ideas into bright, happy drawings.",
        quote: "Small Hands,|Big Imagination",
        artworks: [
            { image: "assets/students/lakshana/artwork-01.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/lakshana/artwork-02.svg", title: "My Home", category: "Colouring" },
            { image: "assets/students/lakshana/artwork-03.svg", title: "Sunflower", category: "Painting" }
        ]
    },
    {
        id: "aditya",
        name: "Aditya N",
        course: "Painting",
        age: "14",
        profile: "assets/students/aditya/profile.svg",
        description: "An enthusiastic painter exploring colour mixing, brushwork and composition across watercolour and acrylic.",
        quote: "Colours of|My Imagination",
        artworks: [
            { image: "assets/students/aditya/artwork-01.svg", title: "Colour Study", category: "Acrylic Painting" },
            { image: "assets/students/aditya/artwork-02.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/aditya/artwork-03.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/aditya/artwork-04.svg", title: "Little Fish", category: "Colouring" },
            { image: "assets/students/aditya/artwork-05.svg", title: "Night City", category: "Drawing & Colouring" }
        ]
    },
    {
        id: "varsha",
        name: "Varsha G",
        course: "Professional Course",
        age: "19",
        profile: "assets/students/varsha/profile.svg",
        description: "A dedicated student preparing for a career in art and design through structured, technical training.",
        quote: "Skill Meets|Passion",
        artworks: [
            { image: "assets/students/varsha/artwork-01.svg", title: "Autumn Tree", category: "Watercolour" },
            { image: "assets/students/varsha/artwork-02.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/varsha/artwork-03.svg", title: "My Home", category: "Colouring" },
            { image: "assets/students/varsha/artwork-04.svg", title: "Colour Study", category: "Acrylic Painting" },
            { image: "assets/students/varsha/artwork-05.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/varsha/artwork-06.svg", title: "Fruit Bowl", category: "Still Life" }
        ]
    },
    {
        id: "sanjay",
        name: "Sanjay R",
        course: "Short-Term Course",
        age: "34",
        profile: "assets/students/sanjay/profile.svg",
        description: "A hobby artist exploring glass painting, mandala art and other specialised forms in a short-term course.",
        quote: "Create, Learn,|Take Home",
        artworks: [
            { image: "assets/students/sanjay/artwork-01.svg", title: "Colour Study", category: "Acrylic Painting" },
            { image: "assets/students/sanjay/artwork-02.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/sanjay/artwork-03.svg", title: "Butterfly", category: "Drawing & Colouring" }
        ]
    },
    {
        id: "keerthana",
        name: "Keerthana B",
        course: "Painting",
        age: "16",
        profile: "assets/students/keerthana/profile.svg",
        description: "An enthusiastic painter exploring colour mixing, brushwork and composition across watercolour and acrylic.",
        quote: "Colours of|My Imagination",
        artworks: [
            { image: "assets/students/keerthana/artwork-01.svg", title: "Autumn Tree", category: "Watercolour" },
            { image: "assets/students/keerthana/artwork-02.svg", title: "Colour Study", category: "Acrylic Painting" },
            { image: "assets/students/keerthana/artwork-03.svg", title: "Mandala", category: "Mandala Art" },
            { image: "assets/students/keerthana/artwork-04.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/keerthana/artwork-05.svg", title: "Little Fish", category: "Colouring" }
        ]
    },
    {
        id: "yuvan",
        name: "Yuvan A",
        course: "Kids Art Class",
        age: "5",
        profile: "assets/students/yuvan/profile.svg",
        description: "A cheerful young learner who loves exploring colours and turning everyday ideas into bright, happy drawings.",
        quote: "Small Hands,|Big Imagination",
        artworks: [
            { image: "assets/students/yuvan/artwork-01.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/yuvan/artwork-02.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/yuvan/artwork-03.svg", title: "Landscape", category: "Painting" }
        ]
    },
    {
        id: "shruti",
        name: "Shruti D",
        course: "Drawing",
        age: "9",
        profile: "assets/students/shruti/profile.svg",
        description: "A focused young artist building strong drawing fundamentals through regular practice with pencil, shapes and shading.",
        quote: "Every Line|Tells a Story",
        artworks: [
            { image: "assets/students/shruti/artwork-01.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/shruti/artwork-02.svg", title: "Little Fish", category: "Colouring" },
            { image: "assets/students/shruti/artwork-03.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/shruti/artwork-04.svg", title: "Colour Study", category: "Acrylic Painting" }
        ]
    },
    {
        id: "nikhil",
        name: "Nikhil J",
        course: "Fine Arts",
        age: "17",
        profile: "assets/students/nikhil/profile.svg",
        description: "A thoughtful artist developing a personal style across drawing, painting and still life studies.",
        quote: "Art is How|I See the World",
        artworks: [
            { image: "assets/students/nikhil/artwork-01.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/nikhil/artwork-02.svg", title: "Autumn Tree", category: "Watercolour" },
            { image: "assets/students/nikhil/artwork-03.svg", title: "My Home", category: "Colouring" },
            { image: "assets/students/nikhil/artwork-04.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/nikhil/artwork-05.svg", title: "Fruit Bowl", category: "Still Life" }
        ]
    },
    {
        id: "pooja",
        name: "Pooja H",
        course: "Adult Art Class",
        age: "29",
        profile: "assets/students/pooja/profile.svg",
        description: "An adult learner who returned to art as a creative passion and enjoys experimenting with new mediums.",
        quote: "Never Too Late|to Create",
        artworks: [
            { image: "assets/students/pooja/artwork-01.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/pooja/artwork-02.svg", title: "My Home", category: "Colouring" },
            { image: "assets/students/pooja/artwork-03.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/pooja/artwork-04.svg", title: "Landscape", category: "Painting" }
        ]
    },
    {
        id: "tharun",
        name: "Tharun S",
        course: "Drawing",
        age: "8",
        profile: "assets/students/tharun/profile.svg",
        description: "A focused young artist building strong drawing fundamentals through regular practice with pencil, shapes and shading.",
        quote: "Every Line|Tells a Story",
        artworks: [
            { image: "assets/students/tharun/artwork-01.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/tharun/artwork-02.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/tharun/artwork-03.svg", title: "Mandala", category: "Mandala Art" }
        ]
    },
    {
        id: "janani",
        name: "Janani K",
        course: "Painting",
        age: "13",
        profile: "assets/students/janani/profile.svg",
        description: "An enthusiastic painter exploring colour mixing, brushwork and composition across watercolour and acrylic.",
        quote: "Colours of|My Imagination",
        artworks: [
            { image: "assets/students/janani/artwork-01.svg", title: "Colour Study", category: "Acrylic Painting" },
            { image: "assets/students/janani/artwork-02.svg", title: "Landscape", category: "Painting" },
            { image: "assets/students/janani/artwork-03.svg", title: "Sunflower", category: "Painting" },
            { image: "assets/students/janani/artwork-04.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/janani/artwork-05.svg", title: "Autumn Tree", category: "Watercolour" }
        ]
    },
    {
        id: "akash",
        name: "Akash V",
        course: "Professional Course",
        age: "21",
        profile: "assets/students/akash/profile.svg",
        description: "A dedicated student preparing for a career in art and design through structured, technical training.",
        quote: "Skill Meets|Passion",
        artworks: [
            { image: "assets/students/akash/artwork-01.svg", title: "Colour Study", category: "Acrylic Painting" },
            { image: "assets/students/akash/artwork-02.svg", title: "Mandala", category: "Mandala Art" },
            { image: "assets/students/akash/artwork-03.svg", title: "Sailing Boat", category: "Painting" },
            { image: "assets/students/akash/artwork-04.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/akash/artwork-05.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/akash/artwork-06.svg", title: "Fruit Bowl", category: "Still Life" }
        ]
    },
    {
        id: "swetha",
        name: "Swetha N",
        course: "Short-Term Course",
        age: "41",
        profile: "assets/students/swetha/profile.svg",
        description: "A hobby artist exploring glass painting, mandala art and other specialised forms in a short-term course.",
        quote: "Create, Learn,|Take Home",
        artworks: [
            { image: "assets/students/swetha/artwork-01.svg", title: "Colour Study", category: "Acrylic Painting" },
            { image: "assets/students/swetha/artwork-02.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/swetha/artwork-03.svg", title: "Little Fish", category: "Colouring" },
            { image: "assets/students/swetha/artwork-04.svg", title: "Night City", category: "Drawing & Colouring" }
        ]
    },
    {
        id: "dhruv",
        name: "Dhruv M",
        course: "Kids Art Class",
        age: "7",
        profile: "assets/students/dhruv/profile.svg",
        description: "A cheerful young learner who loves exploring colours and turning everyday ideas into bright, happy drawings.",
        quote: "Small Hands,|Big Imagination",
        artworks: [
            { image: "assets/students/dhruv/artwork-01.svg", title: "Fruit Bowl", category: "Still Life" },
            { image: "assets/students/dhruv/artwork-02.svg", title: "Little Fish", category: "Colouring" },
            { image: "assets/students/dhruv/artwork-03.svg", title: "Sunflower", category: "Painting" }
        ]
    },
    {
        id: "riya",
        name: "Riya C",
        course: "Painting",
        age: "12",
        profile: "assets/students/riya/profile.svg",
        description: "An enthusiastic painter exploring colour mixing, brushwork and composition across watercolour and acrylic.",
        quote: "Colours of|My Imagination",
        artworks: [
            { image: "assets/students/riya/artwork-01.svg", title: "Sailing Boat", category: "Painting" },
            { image: "assets/students/riya/artwork-02.svg", title: "Colour Study", category: "Acrylic Painting" },
            { image: "assets/students/riya/artwork-03.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/riya/artwork-04.svg", title: "Autumn Tree", category: "Watercolour" },
            { image: "assets/students/riya/artwork-05.svg", title: "Night City", category: "Drawing & Colouring" }
        ]
    },
    {
        id: "madhan",
        name: "Madhan P",
        course: "Adult Art Class",
        age: "38",
        profile: "assets/students/madhan/profile.svg",
        description: "An adult learner who returned to art as a creative passion and enjoys experimenting with new mediums.",
        quote: "Never Too Late|to Create",
        artworks: [
            { image: "assets/students/madhan/artwork-01.svg", title: "Mandala", category: "Mandala Art" },
            { image: "assets/students/madhan/artwork-02.svg", title: "Butterfly", category: "Drawing & Colouring" },
            { image: "assets/students/madhan/artwork-03.svg", title: "Night City", category: "Drawing & Colouring" },
            { image: "assets/students/madhan/artwork-04.svg", title: "Little Fish", category: "Colouring" }
        ]
    }
];
