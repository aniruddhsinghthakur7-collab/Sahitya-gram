# साझा बैकएंड का प्रस्ताव

## सेवा-विभाजन
- Authentication: Supabase Auth. Google login संभव; Zoho/Facebook को उनके उपलब्ध OAuth provider/configuration के अनुसार अलग से सेट करना होगा।
- Database: PostgreSQL tables in `supabase_schema.sql`.
- Image/cover storage: Supabase Storage buckets with policies.
- Website: इस PWA को HTTPS hosting पर प्रकाशित करना।
- Android: Capacitor shell में यही वेब ऐप; API और डेटाबेस समान रहेंगे।
- Admin: अलग role/claim और server-side policies; UI छिपाना सुरक्षा नहीं है।

## सुरक्षा से पहले जरूरी काम
1. RLS हर user table पर enable करें।
2. सार्वजनिक पढ़ने और authenticated write permissions अलग रखें।
3. `profiles` पर user केवल अपनी निजी संपादन योग्य fields बदल सके।
4. `works` में published works public-read; draft केवल author/admin को दिखें।
5. ratings में unique(work_id,user_id) एक यूज़र की एक सक्रिय रेटिंग सुनिश्चित करता है।
6. संदेश केवल sender/recipient को दिखें; recipient permission/block logic server-side enforce हो।
7. account deletion request के लिए audit log और admin workflow जोड़ें।
8. rate limits, spam checks, report/moderation tables और backups जोड़ें।

यह शुरुआती आधार है, audited production security configuration नहीं।
