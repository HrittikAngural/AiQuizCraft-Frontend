export const quizTimeOptions = [
  1, 2, 5, 10, 15, 20,
  ...Array.from({ length: 32 }, (_, index) => 25 + index * 5),
];
