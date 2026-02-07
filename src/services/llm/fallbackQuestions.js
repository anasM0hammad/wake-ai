/**
 * Fallback Questions - 40 per category
 * Grade 2-3 level, simple and solvable mentally
 */

const MATH_QUESTIONS = [
  { id: 'math-001', category: 'math', question: 'What is 7 + 8?', options: ['13', '14', '15', '16'], correctIndex: 2 },
  { id: 'math-002', category: 'math', question: 'What is 12 - 5?', options: ['6', '7', '8', '9'], correctIndex: 1 },
  { id: 'math-003', category: 'math', question: 'What is 6 × 3?', options: ['15', '18', '21', '24'], correctIndex: 1 },
  { id: 'math-004', category: 'math', question: 'What is 20 ÷ 4?', options: ['4', '5', '6', '7'], correctIndex: 1 },
  { id: 'math-005', category: 'math', question: 'What is 9 + 6?', options: ['13', '14', '15', '16'], correctIndex: 2 },
  { id: 'math-006', category: 'math', question: 'What is 15 - 8?', options: ['5', '6', '7', '8'], correctIndex: 2 },
  { id: 'math-007', category: 'math', question: 'What is 4 × 5?', options: ['18', '20', '22', '24'], correctIndex: 1 },
  { id: 'math-008', category: 'math', question: 'What is 18 ÷ 3?', options: ['5', '6', '7', '8'], correctIndex: 1 },
  { id: 'math-009', category: 'math', question: 'What is 11 + 9?', options: ['18', '19', '20', '21'], correctIndex: 2 },
  { id: 'math-010', category: 'math', question: 'What is 16 - 7?', options: ['7', '8', '9', '10'], correctIndex: 2 },
  { id: 'math-011', category: 'math', question: 'What is 7 × 2?', options: ['12', '13', '14', '15'], correctIndex: 2 },
  { id: 'math-012', category: 'math', question: 'What is 24 ÷ 6?', options: ['3', '4', '5', '6'], correctIndex: 1 },
  { id: 'math-013', category: 'math', question: 'What is 8 + 7?', options: ['13', '14', '15', '16'], correctIndex: 2 },
  { id: 'math-014', category: 'math', question: 'What is 14 - 6?', options: ['6', '7', '8', '9'], correctIndex: 2 },
  { id: 'math-015', category: 'math', question: 'What is 5 × 4?', options: ['18', '19', '20', '21'], correctIndex: 2 },
  { id: 'math-016', category: 'math', question: 'What is 15 ÷ 3?', options: ['4', '5', '6', '7'], correctIndex: 1 },
  { id: 'math-017', category: 'math', question: 'What is 6 + 9?', options: ['13', '14', '15', '16'], correctIndex: 2 },
  { id: 'math-018', category: 'math', question: 'What is 17 - 9?', options: ['6', '7', '8', '9'], correctIndex: 2 },
  { id: 'math-019', category: 'math', question: 'What is 3 × 6?', options: ['15', '16', '17', '18'], correctIndex: 3 },
  { id: 'math-020', category: 'math', question: 'What is 12 ÷ 4?', options: ['2', '3', '4', '5'], correctIndex: 1 },
  { id: 'math-021', category: 'math', question: 'What is 5 + 8?', options: ['11', '12', '13', '14'], correctIndex: 2 },
  { id: 'math-022', category: 'math', question: 'What is 13 - 4?', options: ['7', '8', '9', '10'], correctIndex: 2 },
  { id: 'math-023', category: 'math', question: 'What is 8 × 2?', options: ['14', '15', '16', '17'], correctIndex: 2 },
  { id: 'math-024', category: 'math', question: 'What is 16 ÷ 2?', options: ['6', '7', '8', '9'], correctIndex: 2 },
  { id: 'math-025', category: 'math', question: 'What is 10 + 7?', options: ['15', '16', '17', '18'], correctIndex: 2 },
  { id: 'math-026', category: 'math', question: 'What is 19 - 11?', options: ['6', '7', '8', '9'], correctIndex: 2 },
  { id: 'math-027', category: 'math', question: 'What is 9 × 2?', options: ['16', '17', '18', '19'], correctIndex: 2 },
  { id: 'math-028', category: 'math', question: 'What is 21 ÷ 7?', options: ['2', '3', '4', '5'], correctIndex: 1 },
  { id: 'math-029', category: 'math', question: 'What is 4 + 9?', options: ['11', '12', '13', '14'], correctIndex: 2 },
  { id: 'math-030', category: 'math', question: 'What is 18 - 9?', options: ['7', '8', '9', '10'], correctIndex: 2 },
  { id: 'math-031', category: 'math', question: 'What is 6 × 4?', options: ['22', '23', '24', '25'], correctIndex: 2 },
  { id: 'math-032', category: 'math', question: 'What is 10 ÷ 2?', options: ['3', '4', '5', '6'], correctIndex: 2 },
  { id: 'math-033', category: 'math', question: 'What is 8 + 6?', options: ['12', '13', '14', '15'], correctIndex: 2 },
  { id: 'math-034', category: 'math', question: 'What is 20 - 12?', options: ['6', '7', '8', '9'], correctIndex: 2 },
  { id: 'math-035', category: 'math', question: 'What is 5 × 5?', options: ['20', '23', '25', '27'], correctIndex: 2 },
  { id: 'math-036', category: 'math', question: 'What is 14 ÷ 2?', options: ['5', '6', '7', '8'], correctIndex: 2 },
  { id: 'math-037', category: 'math', question: 'What is 7 + 6?', options: ['11', '12', '13', '14'], correctIndex: 2 },
  { id: 'math-038', category: 'math', question: 'What is 11 - 3?', options: ['6', '7', '8', '9'], correctIndex: 2 },
  { id: 'math-039', category: 'math', question: 'What is 4 × 4?', options: ['14', '15', '16', '17'], correctIndex: 2 },
  { id: 'math-040', category: 'math', question: 'What is 18 ÷ 6?', options: ['2', '3', '4', '5'], correctIndex: 1 }
];

const PATTERNS_QUESTIONS = [
  { id: 'patterns-001', category: 'patterns', question: '2, 4, 6, 8, ?', options: ['9', '10', '11', '12'], correctIndex: 1 },
  { id: 'patterns-002', category: 'patterns', question: '5, 10, 15, 20, ?', options: ['22', '24', '25', '30'], correctIndex: 2 },
  { id: 'patterns-003', category: 'patterns', question: '1, 3, 5, 7, ?', options: ['8', '9', '10', '11'], correctIndex: 1 },
  { id: 'patterns-004', category: 'patterns', question: '3, 6, 9, 12, ?', options: ['13', '14', '15', '16'], correctIndex: 2 },
  { id: 'patterns-005', category: 'patterns', question: '10, 20, 30, 40, ?', options: ['45', '50', '55', '60'], correctIndex: 1 },
  { id: 'patterns-006', category: 'patterns', question: '4, 8, 12, 16, ?', options: ['18', '20', '22', '24'], correctIndex: 1 },
  { id: 'patterns-007', category: 'patterns', question: '1, 2, 4, 8, ?', options: ['10', '12', '14', '16'], correctIndex: 3 },
  { id: 'patterns-008', category: 'patterns', question: '7, 14, 21, 28, ?', options: ['32', '35', '38', '42'], correctIndex: 1 },
  { id: 'patterns-009', category: 'patterns', question: '2, 5, 8, 11, ?', options: ['12', '13', '14', '15'], correctIndex: 2 },
  { id: 'patterns-010', category: 'patterns', question: '20, 18, 16, 14, ?', options: ['10', '11', '12', '13'], correctIndex: 2 },
  { id: 'patterns-011', category: 'patterns', question: '1, 4, 7, 10, ?', options: ['11', '12', '13', '14'], correctIndex: 2 },
  { id: 'patterns-012', category: 'patterns', question: '6, 12, 18, 24, ?', options: ['28', '30', '32', '34'], correctIndex: 1 },
  { id: 'patterns-013', category: 'patterns', question: '15, 12, 9, 6, ?', options: ['2', '3', '4', '5'], correctIndex: 1 },
  { id: 'patterns-014', category: 'patterns', question: '2, 4, 8, 16, ?', options: ['24', '28', '30', '32'], correctIndex: 3 },
  { id: 'patterns-015', category: 'patterns', question: '9, 18, 27, 36, ?', options: ['42', '45', '48', '50'], correctIndex: 1 },
  { id: 'patterns-016', category: 'patterns', question: '5, 7, 9, 11, ?', options: ['12', '13', '14', '15'], correctIndex: 1 },
  { id: 'patterns-017', category: 'patterns', question: '25, 20, 15, 10, ?', options: ['4', '5', '6', '7'], correctIndex: 1 },
  { id: 'patterns-018', category: 'patterns', question: '3, 5, 7, 9, ?', options: ['10', '11', '12', '13'], correctIndex: 1 },
  { id: 'patterns-019', category: 'patterns', question: '8, 16, 24, 32, ?', options: ['36', '38', '40', '42'], correctIndex: 2 },
  { id: 'patterns-020', category: 'patterns', question: '1, 2, 3, 5, 8, ?', options: ['10', '11', '12', '13'], correctIndex: 3 },
  { id: 'patterns-021', category: 'patterns', question: '4, 6, 8, 10, ?', options: ['11', '12', '13', '14'], correctIndex: 1 },
  { id: 'patterns-022', category: 'patterns', question: '30, 25, 20, 15, ?', options: ['8', '9', '10', '12'], correctIndex: 2 },
  { id: 'patterns-023', category: 'patterns', question: '2, 6, 10, 14, ?', options: ['16', '17', '18', '19'], correctIndex: 2 },
  { id: 'patterns-024', category: 'patterns', question: '11, 22, 33, 44, ?', options: ['50', '54', '55', '56'], correctIndex: 2 },
  { id: 'patterns-025', category: 'patterns', question: '1, 3, 6, 10, ?', options: ['13', '14', '15', '16'], correctIndex: 2 },
  { id: 'patterns-026', category: 'patterns', question: '5, 8, 11, 14, ?', options: ['15', '16', '17', '18'], correctIndex: 2 },
  { id: 'patterns-027', category: 'patterns', question: '18, 15, 12, 9, ?', options: ['5', '6', '7', '8'], correctIndex: 1 },
  { id: 'patterns-028', category: 'patterns', question: '2, 3, 5, 8, ?', options: ['10', '11', '12', '13'], correctIndex: 2 },
  { id: 'patterns-029', category: 'patterns', question: '10, 12, 14, 16, ?', options: ['17', '18', '19', '20'], correctIndex: 1 },
  { id: 'patterns-030', category: 'patterns', question: '1, 5, 9, 13, ?', options: ['15', '16', '17', '18'], correctIndex: 2 },
  { id: 'patterns-031', category: 'patterns', question: '24, 21, 18, 15, ?', options: ['11', '12', '13', '14'], correctIndex: 1 },
  { id: 'patterns-032', category: 'patterns', question: '3, 7, 11, 15, ?', options: ['17', '18', '19', '20'], correctIndex: 2 },
  { id: 'patterns-033', category: 'patterns', question: '6, 9, 12, 15, ?', options: ['16', '17', '18', '19'], correctIndex: 2 },
  { id: 'patterns-034', category: 'patterns', question: '4, 7, 10, 13, ?', options: ['14', '15', '16', '17'], correctIndex: 2 },
  { id: 'patterns-035', category: 'patterns', question: '12, 10, 8, 6, ?', options: ['3', '4', '5', '2'], correctIndex: 1 },
  { id: 'patterns-036', category: 'patterns', question: '1, 4, 9, 16, ?', options: ['20', '23', '25', '27'], correctIndex: 2 },
  { id: 'patterns-037', category: 'patterns', question: '7, 10, 13, 16, ?', options: ['17', '18', '19', '20'], correctIndex: 2 },
  { id: 'patterns-038', category: 'patterns', question: '2, 4, 6, 8, 10, ?', options: ['11', '12', '13', '14'], correctIndex: 1 },
  { id: 'patterns-039', category: 'patterns', question: '5, 9, 13, 17, ?', options: ['19', '20', '21', '22'], correctIndex: 2 },
  { id: 'patterns-040', category: 'patterns', question: '16, 14, 12, 10, ?', options: ['7', '8', '9', '6'], correctIndex: 1 }
];

const GENERAL_QUESTIONS = [
  { id: 'general-001', category: 'general', question: 'What color is the sky?', options: ['Green', 'Blue', 'Red', 'Yellow'], correctIndex: 1 },
  { id: 'general-002', category: 'general', question: 'How many legs does a dog have?', options: ['2', '3', '4', '6'], correctIndex: 2 },
  { id: 'general-003', category: 'general', question: 'What is the largest planet?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correctIndex: 2 },
  { id: 'general-004', category: 'general', question: 'How many days in a week?', options: ['5', '6', '7', '8'], correctIndex: 2 },
  { id: 'general-005', category: 'general', question: 'What animal says "moo"?', options: ['Dog', 'Cat', 'Cow', 'Pig'], correctIndex: 2 },
  { id: 'general-006', category: 'general', question: 'What color is grass?', options: ['Blue', 'Green', 'Red', 'Brown'], correctIndex: 1 },
  { id: 'general-007', category: 'general', question: 'How many months in a year?', options: ['10', '11', '12', '13'], correctIndex: 2 },
  { id: 'general-008', category: 'general', question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Rome'], correctIndex: 2 },
  { id: 'general-009', category: 'general', question: 'How many colors in a rainbow?', options: ['5', '6', '7', '8'], correctIndex: 2 },
  { id: 'general-010', category: 'general', question: 'What planet is closest to Sun?', options: ['Venus', 'Mercury', 'Earth', 'Mars'], correctIndex: 1 },
  { id: 'general-011', category: 'general', question: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3 },
  { id: 'general-012', category: 'general', question: 'How many wheels on a car?', options: ['2', '3', '4', '6'], correctIndex: 2 },
  { id: 'general-013', category: 'general', question: 'What color is snow?', options: ['Blue', 'Gray', 'White', 'Clear'], correctIndex: 2 },
  { id: 'general-014', category: 'general', question: 'How many sides has a triangle?', options: ['2', '3', '4', '5'], correctIndex: 1 },
  { id: 'general-015', category: 'general', question: 'What animal is king of jungle?', options: ['Tiger', 'Lion', 'Bear', 'Wolf'], correctIndex: 1 },
  { id: 'general-016', category: 'general', question: 'What is frozen water called?', options: ['Steam', 'Ice', 'Mist', 'Dew'], correctIndex: 1 },
  { id: 'general-017', category: 'general', question: 'How many hours in a day?', options: ['12', '20', '24', '48'], correctIndex: 2 },
  { id: 'general-018', category: 'general', question: 'What color is a banana?', options: ['Red', 'Green', 'Yellow', 'Orange'], correctIndex: 2 },
  { id: 'general-019', category: 'general', question: 'What season comes after winter?', options: ['Summer', 'Fall', 'Spring', 'Autumn'], correctIndex: 2 },
  { id: 'general-020', category: 'general', question: 'How many continents are there?', options: ['5', '6', '7', '8'], correctIndex: 2 },
  { id: 'general-021', category: 'general', question: 'What do bees make?', options: ['Milk', 'Honey', 'Sugar', 'Butter'], correctIndex: 1 },
  { id: 'general-022', category: 'general', question: 'What is the capital of Japan?', options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'], correctIndex: 2 },
  { id: 'general-023', category: 'general', question: 'How many legs does a spider have?', options: ['4', '6', '8', '10'], correctIndex: 2 },
  { id: 'general-024', category: 'general', question: 'What color is the sun?', options: ['Red', 'White', 'Yellow', 'Orange'], correctIndex: 2 },
  { id: 'general-025', category: 'general', question: 'Which animal has a trunk?', options: ['Giraffe', 'Elephant', 'Horse', 'Rhino'], correctIndex: 1 },
  { id: 'general-026', category: 'general', question: 'How many minutes in an hour?', options: ['30', '45', '60', '100'], correctIndex: 2 },
  { id: 'general-027', category: 'general', question: 'What do we breathe?', options: ['Water', 'Air', 'Food', 'Light'], correctIndex: 1 },
  { id: 'general-028', category: 'general', question: 'What color is a stop sign?', options: ['Green', 'Blue', 'Red', 'Yellow'], correctIndex: 2 },
  { id: 'general-029', category: 'general', question: 'How many fingers on one hand?', options: ['3', '4', '5', '6'], correctIndex: 2 },
  { id: 'general-030', category: 'general', question: 'What is Earth\'s only moon called?', options: ['Luna', 'Moon', 'Titan', 'Europa'], correctIndex: 1 },
  { id: 'general-031', category: 'general', question: 'What do cows drink?', options: ['Milk', 'Juice', 'Water', 'Soda'], correctIndex: 2 },
  { id: 'general-032', category: 'general', question: 'What is the capital of Italy?', options: ['Milan', 'Venice', 'Rome', 'Naples'], correctIndex: 2 },
  { id: 'general-033', category: 'general', question: 'How many wings does a bird have?', options: ['1', '2', '3', '4'], correctIndex: 1 },
  { id: 'general-034', category: 'general', question: 'What color is a carrot?', options: ['Red', 'Green', 'Orange', 'Purple'], correctIndex: 2 },
  { id: 'general-035', category: 'general', question: 'Which animal lives in water?', options: ['Dog', 'Cat', 'Fish', 'Bird'], correctIndex: 2 },
  { id: 'general-036', category: 'general', question: 'How many eyes do humans have?', options: ['1', '2', '3', '4'], correctIndex: 1 },
  { id: 'general-037', category: 'general', question: 'What planet has rings?', options: ['Mars', 'Venus', 'Saturn', 'Mercury'], correctIndex: 2 },
  { id: 'general-038', category: 'general', question: 'What color is an apple?', options: ['Blue', 'Green', 'Red', 'Purple'], correctIndex: 2 },
  { id: 'general-039', category: 'general', question: 'How many seasons are there?', options: ['2', '3', '4', '5'], correctIndex: 2 },
  { id: 'general-040', category: 'general', question: 'What is baby cat called?', options: ['Puppy', 'Kitten', 'Cub', 'Calf'], correctIndex: 1 }
];

const LOGIC_QUESTIONS = [
  { id: 'logic-001', category: 'logic', question: 'If 2 apples cost $4, how much is 1 apple?', options: ['$1', '$2', '$3', '$4'], correctIndex: 1 },
  { id: 'logic-002', category: 'logic', question: 'Tom has 5 candies. He eats 2. How many left?', options: ['2', '3', '4', '5'], correctIndex: 1 },
  { id: 'logic-003', category: 'logic', question: 'If today is Monday, what is tomorrow?', options: ['Sunday', 'Tuesday', 'Wednesday', 'Monday'], correctIndex: 1 },
  { id: 'logic-004', category: 'logic', question: 'Mary is taller than Sue. Sue is taller than Ann. Who is shortest?', options: ['Mary', 'Sue', 'Ann', 'All same'], correctIndex: 2 },
  { id: 'logic-005', category: 'logic', question: 'If 3 pens cost $6, how much is 1 pen?', options: ['$1', '$2', '$3', '$6'], correctIndex: 1 },
  { id: 'logic-006', category: 'logic', question: 'Sam has 8 toys. He gives 3 away. How many left?', options: ['3', '4', '5', '6'], correctIndex: 2 },
  { id: 'logic-007', category: 'logic', question: 'What comes after Sunday?', options: ['Saturday', 'Monday', 'Tuesday', 'Friday'], correctIndex: 1 },
  { id: 'logic-008', category: 'logic', question: 'If you have 10 cookies and eat half, how many left?', options: ['3', '4', '5', '6'], correctIndex: 2 },
  { id: 'logic-009', category: 'logic', question: 'Red is to stop as green is to?', options: ['Wait', 'Go', 'Slow', 'Turn'], correctIndex: 1 },
  { id: 'logic-010', category: 'logic', question: 'If 4 books cost $8, how much is 1 book?', options: ['$1', '$2', '$4', '$8'], correctIndex: 1 },
  { id: 'logic-011', category: 'logic', question: 'Dad is older than Mom. Mom is older than me. Who is youngest?', options: ['Dad', 'Mom', 'Me', 'All same'], correctIndex: 2 },
  { id: 'logic-012', category: 'logic', question: 'If I have 6 balls and get 4 more, how many total?', options: ['8', '9', '10', '11'], correctIndex: 2 },
  { id: 'logic-013', category: 'logic', question: 'What month comes after March?', options: ['February', 'April', 'May', 'June'], correctIndex: 1 },
  { id: 'logic-014', category: 'logic', question: 'Bird is to fly as fish is to?', options: ['Walk', 'Run', 'Swim', 'Jump'], correctIndex: 2 },
  { id: 'logic-015', category: 'logic', question: 'If 5 oranges cost $10, how much is 1 orange?', options: ['$1', '$2', '$5', '$10'], correctIndex: 1 },
  { id: 'logic-016', category: 'logic', question: 'I have 7 pencils. I lose 2. How many left?', options: ['3', '4', '5', '6'], correctIndex: 2 },
  { id: 'logic-017', category: 'logic', question: 'What day comes before Friday?', options: ['Saturday', 'Sunday', 'Thursday', 'Wednesday'], correctIndex: 2 },
  { id: 'logic-018', category: 'logic', question: 'Hot is to cold as day is to?', options: ['Light', 'Night', 'Sun', 'Warm'], correctIndex: 1 },
  { id: 'logic-019', category: 'logic', question: 'If 2 toys cost $6, how much for 1 toy?', options: ['$2', '$3', '$4', '$6'], correctIndex: 1 },
  { id: 'logic-020', category: 'logic', question: 'Ann has 9 stickers. She gives 4 to Sue. How many left?', options: ['3', '4', '5', '6'], correctIndex: 2 },
  { id: 'logic-021', category: 'logic', question: 'What season comes before summer?', options: ['Fall', 'Winter', 'Spring', 'Autumn'], correctIndex: 2 },
  { id: 'logic-022', category: 'logic', question: 'Up is to down as left is to?', options: ['Up', 'Down', 'Right', 'Left'], correctIndex: 2 },
  { id: 'logic-023', category: 'logic', question: 'If I have 4 cats and get 3 more, how many total?', options: ['5', '6', '7', '8'], correctIndex: 2 },
  { id: 'logic-024', category: 'logic', question: 'Big is to small as tall is to?', options: ['High', 'Short', 'Wide', 'Long'], correctIndex: 1 },
  { id: 'logic-025', category: 'logic', question: 'If 6 eggs cost $12, how much is 1 egg?', options: ['$1', '$2', '$3', '$6'], correctIndex: 1 },
  { id: 'logic-026', category: 'logic', question: 'I read 3 books Monday and 4 Tuesday. How many total?', options: ['5', '6', '7', '8'], correctIndex: 2 },
  { id: 'logic-027', category: 'logic', question: 'What month comes before December?', options: ['October', 'November', 'January', 'September'], correctIndex: 1 },
  { id: 'logic-028', category: 'logic', question: 'Happy is to sad as fast is to?', options: ['Quick', 'Slow', 'Run', 'Speed'], correctIndex: 1 },
  { id: 'logic-029', category: 'logic', question: 'If I have 8 grapes and eat 5, how many left?', options: ['2', '3', '4', '5'], correctIndex: 1 },
  { id: 'logic-030', category: 'logic', question: 'A is the first letter. What is the last?', options: ['X', 'Y', 'Z', 'W'], correctIndex: 2 },
  { id: 'logic-031', category: 'logic', question: 'If 3 cups cost $9, how much is 1 cup?', options: ['$2', '$3', '$4', '$9'], correctIndex: 1 },
  { id: 'logic-032', category: 'logic', question: 'I had 10 marbles. Lost 6. How many left?', options: ['2', '3', '4', '5'], correctIndex: 2 },
  { id: 'logic-033', category: 'logic', question: 'Sun is to day as moon is to?', options: ['Star', 'Night', 'Sky', 'Light'], correctIndex: 1 },
  { id: 'logic-034', category: 'logic', question: 'If I score 5 points then 4 more, what is total?', options: ['7', '8', '9', '10'], correctIndex: 2 },
  { id: 'logic-035', category: 'logic', question: 'What comes after 19?', options: ['18', '20', '21', '29'], correctIndex: 1 },
  { id: 'logic-036', category: 'logic', question: 'In is to out as open is to?', options: ['Door', 'Close', 'Window', 'Wide'], correctIndex: 1 },
  { id: 'logic-037', category: 'logic', question: 'If 4 balls cost $8, how much for 2 balls?', options: ['$2', '$3', '$4', '$6'], correctIndex: 2 },
  { id: 'logic-038', category: 'logic', question: 'I have 6 coins. I find 3 more. How many total?', options: ['7', '8', '9', '10'], correctIndex: 2 },
  { id: 'logic-039', category: 'logic', question: 'Young is to old as new is to?', options: ['Fresh', 'Modern', 'Old', 'Young'], correctIndex: 2 },
  { id: 'logic-040', category: 'logic', question: 'What number is between 7 and 9?', options: ['6', '7', '8', '10'], correctIndex: 2 }
];

const QUESTIONS_BY_CATEGORY = {
  math: MATH_QUESTIONS,
  patterns: PATTERNS_QUESTIONS,
  general: GENERAL_QUESTIONS,
  logic: LOGIC_QUESTIONS
};

const ALL_QUESTIONS = [
  ...MATH_QUESTIONS,
  ...PATTERNS_QUESTIONS,
  ...GENERAL_QUESTIONS,
  ...LOGIC_QUESTIONS
];

export function getAllFallbackQuestions() {
  return [...ALL_QUESTIONS];
}

export function getFallbackQuestionsByCategory(category) {
  return QUESTIONS_BY_CATEGORY[category] ? [...QUESTIONS_BY_CATEGORY[category]] : [];
}

export function getRandomFallbackQuestions(categories, count) {
  const categoriesList = Array.isArray(categories) ? categories : [categories];
  const availableQuestions = categoriesList
    .filter(cat => QUESTIONS_BY_CATEGORY[cat])
    .flatMap(cat => QUESTIONS_BY_CATEGORY[cat]);

  if (availableQuestions.length === 0) {
    // Fallback to math if no valid categories
    return MATH_QUESTIONS.sort(() => Math.random() - 0.5).slice(0, count);
  }

  const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export default {
  getAllFallbackQuestions,
  getFallbackQuestionsByCategory,
  getRandomFallbackQuestions
};
