EMOTION BASE SMART DIARY — Setup Guide (Windows)

आवश्यक गोष्टी:
1. Node.js LTS install करा: https://nodejs.org/
2. हा ZIP extract करा.
3. Extract केलेला folder उघडा.
4. Folder च्या address bar मध्ये cmd टाइप करून Enter दाबा. किंवा folder मध्ये Right click > Open in Terminal.
5. Terminal मध्ये खालील commands एक-एक करून चालवा:

   npm install
   npm start

6. Terminal मध्ये "Emotion Base Smart Diary is running at http://localhost:3000" दिसेल.
7. Chrome मध्ये http://localhost:3000 उघडा.

पहिल्यांदा वापरताना:
- Create account वर क्लिक करा.
- Name, Username आणि किमान 6 characters चा password टाका.
- नंतर Login करून Overview, Mood diary, Monthly report आणि Mood refresh वापरा.

Features:
- Login आणि Create account
- Mood check-in आणि optional diary note
- Mood diary entries
- निवडलेल्या महिन्याचा report आणि mood counts
- Jokes, music search आणि simple supportive chat
- User session आणि hashed password (bcryptjs)

महत्त्वाच्या सूचना:
- हा college/demo project आहे. डेटा local data/users.json आणि data/moods.json मध्ये save होतो.
- data folder मधील JSON files delete केल्यास saved users/entries नष्ट होतील.
- Public hosting करण्यापूर्वी SESSION_SECRET environment variable बदला, HTTPS वापरा, आणि production database / secure session store लावा.
- Chat हा basic rule-based supportive demo आहे; तो AI therapist किंवा medical diagnosis नाही.
- Songs साठी button YouTube search उघडतो; गाणी website मध्ये host केलेली नाहीत.
