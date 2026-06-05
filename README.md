Finesse — Aplikasi Gamifikasi Keuangan Pribadi
Finesse adalah aplikasi web manajemen keuangan yang menggabungkan konsep gamifikasi dengan kecerdasan buatan, dirancang khusus untuk membantu pengguna — terutama mahasiswa dan anak muda — membangun kebiasaan keuangan yang lebih sehat dengan cara yang menyenangkan.

Masalah yang Diselesaikan
Banyak anak muda kesulitan mengelola keuangan bukan karena tidak mau, tapi karena membosankan. Mencatat pengeluaran terasa seperti tugas, bukan kebiasaan. Finesse mengubah itu dengan meminjam mekanisme dari dunia game.

Cara Kerja
Setiap kali pengguna mencatat transaksi, tiga mesin AI bekerja di balik layar:
1. Deep Learning — Penentu EXP
Model neural network menganalisis pola transaksi (nominal, kategori, waktu, rasio budget) dan menghasilkan nilai EXP yang proporsional. Transaksi yang bijak menghasilkan EXP lebih tinggi, mendorong perilaku finansial yang lebih baik.
2. Machine Learning (K-Means) — Penentu Liga
Setiap pengguna diklasifikasikan ke dalam salah satu dari 4 liga berdasarkan pola pengeluaran bulanannya — Gold, Silver, Bronze, atau Iron. Liga ini bukan soal seberapa banyak uang yang dimiliki, tapi seberapa bijak cara mengelolanya.
3. Generative AI (Gemini) — Generator Misi
Setiap hari, pengguna bisa meminta misi keuangan yang dipersonalisasi oleh AI. Misi ini dinamis — disesuaikan dengan kondisi keuangan aktual pengguna saat itu, bukan template statis.

Cara Jalaninnya:
1. clone/pull git
2. install npm [npm install]
3. pasang .env yang isinya [PORT=3000
                            FASTAPI_URL=https://samuelgautama-finesse-ai-api.hf.space]
4. Masuk ke terminal dengan Path /Finesse kita
5. jalankan [node server/index.js]
6. Jalankan [npx vite page/]
7. klik link atau copy link server ke chrome
