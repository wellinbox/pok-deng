export const GameConfig = {
  minBet: 10,
  maxBet: 10000,
  maxPlayers: 8,
  botDelay: 1000,
  // ทรัพยากรกราฟิกจากแหล่งฟรี (Unsplash/Pexels/Flaticon)
  assets: {
    tableBg: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', // พื้นหลังโต๊ะเขียว
    cardBack: 'https://img.freepik.com/free-vector/blue-playing-card-back-template_1017-27436.jpg?w=800', // ลังหลังไพ่
    chipImages: {
      10: 'https://cdn-icons-png.flaticon.com/512/1029/1029316.png', // Chip สีเทา
      50: 'https://cdn-icons-png.flaticon.com/512/1029/1029324.png', // Chip สีแดง
      100: 'https://cdn-icons-png.flaticon.com/512/1029/1029320.png', // Chip สีน้ำเงิน
      500: 'https://cdn-icons-png.flaticon.com/512/1029/1029328.png', // Chip สีดำ
      1000: 'https://cdn-icons-png.flaticon.com/512/1029/1029332.png', // Chip สีทอง
    },
    avatarPlaceholder: 'https://ui-avatars.com/api/?background=random&color=fff&size=128',
  }
} as const;
