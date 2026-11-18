// Starting menu for Fratelli's Italian Restaurant (North Hills, CA).
// Names, descriptions and prices come from the restaurant's current menu.html.
// Spanish text was written by hand; the owner can edit any of it in the admin.
// Allergens are deliberately left empty: the owner must fill them in (the public
// menu treats "no allergen info" as unknown, never as "allergen free").

const t = (en, es) => ({ en, es: es ?? en });

const SIZES = {
  pizza: (m, l, xl) => [
    { id: "m", label: t("Medium", "Mediana"), price: m },
    { id: "l", label: t("Large", "Grande"), price: l },
    { id: "xl", label: t("X-Large", "Extra grande"), price: xl },
  ],
  salad: (s, l) => [
    { id: "s", label: t("Small", "Chica"), price: s },
    { id: "l", label: t("Large", "Grande"), price: l },
  ],
  tray: (h, f) => [
    { id: "half", label: t("Half tray (10–12)", "Media charola (10–12)"), price: h },
    { id: "full", label: t("Full tray (20–24)", "Charola completa (20–24)"), price: f },
  ],
};

const group = (id, name, options, { required = true, min = 1, max = 1 } = {}) => ({
  id, name, required, min, max,
  options: options.map(([en, es, price = 0], i) => ({ id: `${id}-${i}`, name: t(en, es), price })),
});
const addon = (id, en, es, price) => ({ id, name: t(en, es), price });

const PIZZA_ADDONS = [
  addon("reg-top", "Regular topping (M; L +$1, XL +$2)", "Ingrediente regular (M; G +$1, XG +$2)", 2),
  addon("gour-top", "Gourmet topping (M; L $3.99, XL $4.99)", "Ingrediente gourmet (M; G $3.99, XG $4.99)", 2.5),
];
const PASTA_ADDONS = [
  addon("add-chk", "Add chicken or vegetables", "Agregar pollo o verduras", 4),
  addon("add-shr", "Add bay or jumbo shrimp", "Agregar camarón", 6),
  addon("add-side", "Add minestrone, garden or Caesar salad", "Agregar minestrone, ensalada de la casa o César", 3.5),
];
const DRESSING = group("dressing", t("Dressing", "Aderezo"), [
  ["Italian", "Italiano"], ["Ranch", "Ranch"], ["Blue cheese crumble", "Queso azul en trozos"],
  ["Creamy blue cheese", "Queso azul cremoso"], ["Thousand Island", "Mil islas"],
  ["Balsamic vinegar", "Vinagre balsámico"], ["Raspberry vinegar", "Vinagre de frambuesa"],
]);
const SANDWICH_SIZES = SIZES.salad(11.99, 14.99);
const SANDWICH_ADDONS = [addon("fries", "Add fries", "Agregar papas fritas", 2.99)];
const LUNCH_SIDE = group("side", t("Comes with", "Incluye"), [
  ["Minestrone", "Minestrone"], ["Garden salad", "Ensalada de la casa"], ["Caesar salad", "Ensalada César"],
]);
const CALZONE_STYLE = group("style", t("Style", "Estilo"), [
  ["Calzone", "Calzone"], ["Stromboli (no ricotta)", "Stromboli (sin ricotta)"],
]);

export const categories = [
  { slug: "lunch-specials", name: t("Lunch Specials", "Especiales de almuerzo"), description: t("$13.99 each. Every special comes with minestrone, a garden salad or a Caesar salad.", "$13.99 cada uno. Incluyen minestrone, ensalada de la casa o ensalada César."), image: "/img/sub-fries.jpg" },
  { slug: "pizza", name: t("Pizza", "Pizza"), description: t("Specialty pies in medium, large and extra large, or build your own.", "Pizzas de la casa en mediana, grande y extra grande, o arma la tuya."), image: "/img/pizza-combo.jpg" },
  { slug: "pastas", name: t("Pastas", "Pastas"), description: t("Add minestrone, a garden salad or a Caesar salad for $3.50.", "Agrega minestrone, ensalada de la casa o César por $3.50."), image: "/img/penne-sausage.jpg" },
  { slug: "entrees", name: t("Entrees", "Platos fuertes"), description: t("Served with sautéed vegetables.", "Servidos con verduras salteadas."), image: "/img/salmon-piccata.jpg" },
  { slug: "starters", name: t("Starters", "Entradas"), description: t("Something to share while you wait.", "Algo para compartir mientras esperas."), image: "/img/garlic-rolls.jpg" },
  { slug: "salads", name: t("Salads", "Ensaladas"), description: t("Small or large, with your choice of dressing.", "Chica o grande, con el aderezo de tu elección."), image: "/img/caesar.jpg" },
  { slug: "sandwiches", name: t("Sandwiches", "Sándwiches"), description: t("Every sandwich comes small ($11.99) or large ($14.99). Add fries for $2.99.", "Todos los sándwiches vienen chicos ($11.99) o grandes ($14.99). Agrega papas por $2.99."), image: "/img/italian-cold-cut.jpg" },
  { slug: "calzones", name: t("Calzones & Stromboli", "Calzones y stromboli"), description: t("Any calzone can be made as a stromboli, which comes without ricotta.", "Cualquier calzone puede ser stromboli, que va sin ricotta."), image: "/img/calzone.jpg" },
  { slug: "kids", name: t("Kid's Meals", "Menú infantil"), description: t("Kid-sized portions of the family favorites, $8.99 each.", "Porciones para niños de los favoritos de la familia, $8.99 cada una."), image: "/img/mozz-sticks.jpg" },
  { slug: "desserts", name: t("Desserts", "Postres"), description: t("Save room.", "Guarda espacio."), image: "/img/tiramisu.jpg" },
  { slug: "catering", name: t("Catering", "Banquetes"), description: t("Party trays. A half tray feeds 10 to 12, a full tray feeds 20 to 24. Call (818) 893-9233 to order. 10% charge for dine-in catering.", "Charolas para fiestas. Media charola para 10 a 12 personas, completa para 20 a 24. Llama al (818) 893-9233. Cargo de 10% por banquete en el restaurante."), image: "/img/chicken-parm.jpg" },
  { slug: "beverages", name: t("Beverages", "Bebidas"), description: t("Ask your server for today's drinks.", "Pregunta a tu mesero por las bebidas de hoy."), image: null },
];

// [category, en name, es name, en desc, es desc, price | sizes, extra]
const I = (category, name, desc, price, extra = {}) => ({ category, name, description: desc, price, ...extra });
const V = ["vegetarian"];
const S = ["spicy"];

export const items = [
  // ---------- Lunch specials ----------
  I("lunch-specials", t("Lunch Pasta", "Pasta del almuerzo"), t("Spaghetti marinara, penne pomodoro, penne pink sauce, cheese ravioli, fettuccini Alfredo or spinach ravioli.", "Espagueti marinara, penne pomodoro, penne salsa rosa, ravioles de queso, fettuccini Alfredo o ravioles de espinaca."), 13.99, {
    modifiers: [group("pasta", t("Choose your pasta", "Elige tu pasta"), [["Spaghetti marinara", "Espagueti marinara"], ["Penne pomodoro", "Penne pomodoro"], ["Penne pink sauce", "Penne salsa rosa"], ["Cheese ravioli", "Ravioles de queso"], ["Fettuccini Alfredo", "Fettuccini Alfredo"], ["Spinach ravioli", "Ravioles de espinaca"]]), LUNCH_SIDE],
    featured: true }),
  I("lunch-specials", t("Personal Pizza or Mini Calzone", "Pizza personal o mini calzone"), t("A personal pizza or a mini calzone. Add toppings for 99¢ each.", "Pizza personal o mini calzone. Ingredientes extra a 99¢ cada uno."), 13.99, {
    modifiers: [group("choice", t("Choose one", "Elige uno"), [["Personal pizza", "Pizza personal"], ["Mini calzone", "Mini calzone"]]), LUNCH_SIDE],
    addons: [addon("top", "Extra topping", "Ingrediente extra", 0.99)] }),
  I("lunch-specials", t("Small Sandwich with Fries or Salad", "Sándwich chico con papas o ensalada"), t("Ham and cheese, turkey, eggplant parmesan, meatball, vegetarian, Cajun chicken, pesto chicken, chicken breast or Italian cold cut.", "Jamón y queso, pavo, berenjena parmesana, albóndiga, vegetariano, pollo cajún, pollo al pesto, pechuga de pollo o carnes frías italianas."), 13.99, {
    image: "/img/sub-fries.jpg",
    modifiers: [group("sandwich", t("Choose your sandwich", "Elige tu sándwich"), [["Ham & cheese", "Jamón y queso"], ["Turkey", "Pavo"], ["Eggplant parmesan", "Berenjena parmesana"], ["Meatball", "Albóndiga"], ["Vegetarian", "Vegetariano"], ["Cajun chicken", "Pollo cajún"], ["Pesto chicken", "Pollo al pesto"], ["Chicken breast", "Pechuga de pollo"], ["Italian cold cut", "Carnes frías italianas"]]), group("side", t("Comes with", "Incluye"), [["Fries", "Papas fritas"], ["Minestrone", "Minestrone"], ["Garden salad", "Ensalada de la casa"], ["Caesar salad", "Ensalada César"]])] }),

  // ---------- Pizza ----------
  I("pizza", t("Fratelli's Combo", "Combo Fratelli's"), t("Pepperoni, sausage, onions, bell peppers, black olives and mushrooms.", "Pepperoni, salchicha, cebolla, pimiento, aceitunas negras y champiñones."), SIZES.pizza(21.99, 27.99, 31.99), { image: "/img/pizza-combo.jpg", featured: true, addons: PIZZA_ADDONS }),
  I("pizza", t("Meat Lover", "Amante de la carne"), t("Pepperoni, sausage, meatball and ham.", "Pepperoni, salchicha, albóndiga y jamón."), SIZES.pizza(21.99, 27.99, 31.99), { addons: PIZZA_ADDONS }),
  I("pizza", t("Pesto Chicken Pizza", "Pizza de pollo al pesto"), t("House pesto, garlic, tomatoes, artichoke hearts, mozzarella, parmesan and chicken.", "Pesto de la casa, ajo, tomate, corazones de alcachofa, mozzarella, parmesano y pollo."), SIZES.pizza(21.99, 27.99, 31.99), { image: "/img/pizza-pesto.jpg", featured: true, addons: PIZZA_ADDONS }),
  I("pizza", t("Chicken Fajita Pizza", "Pizza de fajita de pollo"), t("Chicken, bell peppers, tomatoes, onions and mushrooms.", "Pollo, pimiento, tomate, cebolla y champiñones."), SIZES.pizza(21.99, 27.99, 31.99), { addons: PIZZA_ADDONS }),
  I("pizza", t("Spinach Delight", "Delicia de espinaca"), t("Three-cheese sauce, spinach, red onion and sun-dried tomato.", "Salsa de tres quesos, espinaca, cebolla morada y tomate deshidratado."), SIZES.pizza(21.99, 27.99, 31.99), { tags: V, addons: PIZZA_ADDONS }),
  I("pizza", t("BBQ D'luxe", "BBQ D'luxe"), t("Chicken, ranch, red onions, bell peppers, tomato, bacon and green onions.", "Pollo, ranch, cebolla morada, pimiento, tomate, tocino y cebollín."), SIZES.pizza(22.99, 28.99, 32.99), { addons: PIZZA_ADDONS }),
  I("pizza", t("Mediterranean Pizza", "Pizza mediterránea"), t("Three-cheese sauce, red onions, green and black olives, chicken, tomato, feta and oregano.", "Salsa de tres quesos, cebolla morada, aceitunas verdes y negras, pollo, tomate, feta y orégano."), SIZES.pizza(22.99, 28.99, 32.99), { image: "/img/pizza-med.jpg", addons: PIZZA_ADDONS }),
  I("pizza", t("Mexican Pizza", "Pizza mexicana"), t("Refried beans, tomatoes, onions, bell peppers and cilantro, with chicken, beef or pork.", "Frijoles refritos, tomate, cebolla, pimiento y cilantro, con pollo, res o cerdo."), SIZES.pizza(22.99, 28.99, 32.99), { modifiers: [group("protein", t("Protein", "Proteína"), [["Chicken", "Pollo"], ["Beef", "Res"], ["Pork", "Cerdo"]])], addons: PIZZA_ADDONS }),
  I("pizza", t("Vegetarian Pizza", "Pizza vegetariana"), t("Onions, bell peppers, mushrooms, tomatoes and black olives.", "Cebolla, pimiento, champiñones, tomate y aceitunas negras."), SIZES.pizza(21.99, 27.99, 31.99), { tags: V, addons: PIZZA_ADDONS }),
  I("pizza", t("Seafood Pizza", "Pizza de mariscos"), t("Bay shrimp, scallops, chopped clams and mozzarella.", "Camarón, callo de hacha, almejas picadas y mozzarella."), SIZES.pizza(23.99, 30.99, 35.99), { addons: PIZZA_ADDONS }),
  I("pizza", t("BBQ Chicken Pizza", "Pizza de pollo BBQ"), t("BBQ sauce, chicken, bell peppers and onions.", "Salsa BBQ, pollo, pimiento y cebolla."), SIZES.pizza(20.99, 26.99, 30.99), { image: "/img/pizza-bbq.jpg", addons: PIZZA_ADDONS }),
  I("pizza", t("Alfredo Pizza", "Pizza Alfredo"), t("House Alfredo sauce with your choice of two regular toppings.", "Salsa Alfredo de la casa con dos ingredientes regulares a elegir."), SIZES.pizza(20.99, 25.99, 29.99), { addons: PIZZA_ADDONS }),
  I("pizza", t("Three Cheese Pizza", "Pizza tres quesos"), t("Three-cheese sauce with your choice of three regular toppings.", "Salsa de tres quesos con tres ingredientes regulares a elegir."), SIZES.pizza(20.99, 26.99, 30.99), { addons: PIZZA_ADDONS }),
  I("pizza", t("Margarita", "Margarita"), t("Tomatoes, garlic, red onions and basil.", "Tomate, ajo, cebolla morada y albahaca."), SIZES.pizza(20.99, 26.99, 30.99), { tags: V, addons: PIZZA_ADDONS }),
  I("pizza", t("Spinach Artichoke Dip Pizza", "Pizza de dip de espinaca y alcachofa"), t("Creamy Alfredo with spinach, artichoke and mozzarella.", "Alfredo cremoso con espinaca, alcachofa y mozzarella."), SIZES.pizza(20.99, 25.99, 29.99), { tags: V, addons: PIZZA_ADDONS }),
  I("pizza", t("Hawaiian", "Hawaiana"), t("Ham and pineapple.", "Jamón y piña."), SIZES.pizza(17.99, 23.99, 27.99), { addons: PIZZA_ADDONS }),
  I("pizza", t("Build Your Own", "Arma tu pizza"), t("Cheese pizza, then add your toppings. Regular: pepperoni, meatballs, sausage, ham, ground beef, salami, bacon, Canadian bacon, pineapple, mushrooms, bell peppers, black olives, onions, tomatoes, jalapeños, basil. Gourmet: chicken, bay shrimp, spinach, feta, artichoke hearts, green olives.", "Pizza de queso, luego agrega tus ingredientes. Regulares: pepperoni, albóndigas, salchicha, jamón, carne molida, salami, tocino, tocino canadiense, piña, champiñones, pimiento, aceitunas negras, cebolla, tomate, jalapeños, albahaca. Gourmet: pollo, camarón, espinaca, feta, corazones de alcachofa, aceitunas verdes."), SIZES.pizza(13.99, 17.99, 20.99), { tags: V, addons: PIZZA_ADDONS }),

  // ---------- Pastas ----------
  ...[
    ["Fettuccini Alfredo", "Fettuccini Alfredo", 15.99, V],
    ["Penne Pink Sauce", "Penne en salsa rosa", 15.99, V],
    ["Spaghetti Marinara", "Espagueti marinara", 15.99, V],
    ["Spaghetti Pomodoro", "Espagueti pomodoro", 16.99, V],
    ["Spaghetti & Meatballs", "Espagueti con albóndigas", 18.99],
    ["Spaghetti & Sausage", "Espagueti con salchicha", 19.99],
    ["Spaghetti Meat Sauce", "Espagueti a la boloñesa", 18.88],
    ["Meat Lasagna", "Lasaña de carne", 18.99],
    ["Cheese Lasagna", "Lasaña de queso", 16.99, V],
    ["Cheese Ravioli", "Ravioles de queso", 16.99, V],
    ["Meat Ravioli", "Ravioles de carne", 19.99],
    ["Spinach Ravioli", "Ravioles de espinaca", 17.99, V],
    ["Lobster Ravioli", "Ravioles de langosta", 19.99],
    ["Shrimp & Lobster Ravioli", "Ravioles de camarón y langosta", 21.99],
    ["Chicken & Mushroom Ravioli", "Ravioles de pollo y champiñones", 19.99],
    ["Cheese Manicotti", "Manicotti de queso", 16.99, V],
    ["Stuffed Shells", "Conchas rellenas", 16.99, V],
    ["Baked Mostaccioli", "Mostaccioli al horno", 18.99, [], "/img/penne-sausage.jpg"],
  ].map(([en, es, price, tags = [], image]) => I("pastas", t(en, es), t("", ""), price, { tags, image, addons: PASTA_ADDONS })),
  I("pastas", t("Pasta Primavera", "Pasta primavera"), t("Fettuccini in a cream and wine sauce with chicken and sautéed vegetables.", "Fettuccini en salsa de crema y vino con pollo y verduras salteadas."), 21.99, { addons: PASTA_ADDONS }),
  I("pastas", t("Spicy Cajun Chicken Pasta", "Pasta cajún picante con pollo"), t("Penne in a spicy Alfredo with sun-dried tomatoes, chicken and spinach.", "Penne en Alfredo picante con tomate deshidratado, pollo y espinaca."), 21.99, { tags: S, image: "/img/cajun-pasta.jpg", featured: true, addons: PASTA_ADDONS }),
  I("pastas", t("Fajita Pasta", "Pasta fajita"), t("Penne with sautéed tomatoes, onions, bell peppers, mushrooms and fajita-style chicken.", "Penne con tomate, cebolla, pimiento y champiñones salteados y pollo estilo fajita."), 19.99, { addons: PASTA_ADDONS }),
  I("pastas", t("Pesto Chicken Pasta", "Pasta de pollo al pesto"), t("Spaghetti with chicken, sun-dried tomatoes and artichoke hearts in pesto.", "Espagueti con pollo, tomate deshidratado y corazones de alcachofa en pesto."), 19.99, { addons: PASTA_ADDONS }),
  I("pastas", t("Clams Linguini", "Linguini con almejas"), t("Linguini in our clam and wine sauce with baby clams, celery and onions.", "Linguini en nuestra salsa de almeja y vino con almejas, apio y cebolla."), 19.99, { addons: PASTA_ADDONS }),
  I("pastas", t("Fried Spaghetti", "Espagueti frito"), t("Pan-fried spaghetti with sautéed vegetables, topped with mozzarella.", "Espagueti frito en sartén con verduras salteadas y mozzarella."), 19.99, { tags: V, addons: PASTA_ADDONS }),

  // ---------- Entrees ----------
  I("entrees", t("Salmon Piccata", "Salmón piccata"), t("Baked salmon with white wine, lemon, garlic, capers and a light cream over penne.", "Salmón horneado con vino blanco, limón, ajo, alcaparras y un toque de crema sobre penne."), 25.99, { image: "/img/salmon-piccata.jpg", featured: true }),
  I("entrees", t("Seafood Alfredo", "Alfredo de mariscos"), t("Jumbo shrimp, scallops and mushrooms in our Alfredo sauce.", "Camarón jumbo, callo de hacha y champiñones en nuestra salsa Alfredo."), 23.99),
  I("entrees", t("Scallop & Shrimp Pomodoro", "Pomodoro de callo y camarón"), t("Spaghetti with sautéed scallops and shrimp in our garlic, tomato and basil sauce.", "Espagueti con callo de hacha y camarón salteados en salsa de ajo, tomate y albahaca."), 22.99),
  I("entrees", t("Spicy Shrimp Marinara", "Camarón marinara picante"), t("Spaghetti with jumbo shrimp, capers, celery and onion in marinara.", "Espagueti con camarón jumbo, alcaparras, apio y cebolla en marinara."), 22.99, { tags: S }),
  I("entrees", t("Chicken Piccata", "Pollo piccata"), t("Chicken sautéed with white wine, lemon, garlic, capers and a light cream over penne.", "Pollo salteado con vino blanco, limón, ajo, alcaparras y un toque de crema sobre penne."), 22.99),
  I("entrees", t("Chicken Parmesan", "Pollo a la parmesana"), t("Breaded chicken breast baked with mozzarella, with penne marinara.", "Pechuga de pollo empanizada y gratinada con mozzarella, con penne marinara."), 19.99, { image: "/img/chicken-parm.jpg", featured: true }),
  I("entrees", t("Eggplant Parmesan", "Berenjena a la parmesana"), t("Breaded eggplant baked with mozzarella, with penne marinara.", "Berenjena empanizada y gratinada con mozzarella, con penne marinara."), 19.99, { tags: V }),
  I("entrees", t("Cajun Chicken", "Pollo cajún"), t("Grilled chicken breast marinated in our Cajun sauce.", "Pechuga de pollo a la parrilla marinada en nuestra salsa cajún."), 18.99, { tags: S }),

  // ---------- Starters ----------
  I("starters", t("Garlic Cheese Rolls", "Rollos de ajo y queso"), t("Pizza dough stuffed with mozzarella and garlic.", "Masa de pizza rellena de mozzarella y ajo."), 14.68, { tags: V, image: "/img/garlic-rolls.jpg", featured: true }),
  I("starters", t("Spinach Artichoke Dip", "Dip de espinaca y alcachofa"), t("Creamy Alfredo with spinach and artichokes, topped with mozzarella.", "Alfredo cremoso con espinaca y alcachofa, gratinado con mozzarella."), 14.68, { tags: V, image: "/img/spinach-dip.jpg" }),
  I("starters", t("Bruschetta", "Bruschetta"), t("Chopped tomatoes, onions, basil and fresh garlic over bread.", "Tomate picado, cebolla, albahaca y ajo fresco sobre pan."), 11.99, { tags: V, image: "/img/bruschetta.jpg" }),
  I("starters", t("Pesto Bruschetta", "Bruschetta al pesto"), t("Pesto, tomato and melted cheese.", "Pesto, tomate y queso fundido."), 11.99, { tags: V }),
  I("starters", t("Fratelli's Spicy Shrimp", "Camarones picantes Fratelli's"), t("Fresh jalapeños and sautéed onions in our spicy lemon butter sauce.", "Jalapeños frescos y cebolla salteada en nuestra salsa picante de mantequilla y limón."), 18.68, { tags: S }),
  I("starters", t("Calamari Rings", "Aros de calamar"), t("Fried calamari with spicy marinara on the side.", "Calamar frito con marinara picante aparte."), 15.73),
  I("starters", t("Traditional Wings (8 pc)", "Alitas tradicionales (8 pzas)"), t("Buffalo, BBQ, lemon pepper or mango habanero.", "Búfalo, BBQ, limón pimienta o mango habanero."), 14.68, { modifiers: [group("flavor", t("Flavor", "Sabor"), [["Buffalo", "Búfalo"], ["BBQ", "BBQ"], ["Lemon pepper", "Limón pimienta"], ["Mango habanero", "Mango habanero"]])] }),
  I("starters", t("Spicy Diablo Wings", "Alitas diablo picantes"), t("Wings cooked with onions, bell peppers, mushrooms and our diablo sauce.", "Alitas cocinadas con cebolla, pimiento, champiñones y nuestra salsa diablo."), 11.99, { tags: S }),
  I("starters", t("Philly Cheese Steak Fries", "Papas Philly cheese steak"), t("Fries topped with steak, mushrooms, onions and mozzarella.", "Papas fritas con bistec, champiñones, cebolla y mozzarella."), 15.73, { image: "/img/philly-fries.jpg" }),
  I("starters", t("Fish & Chips", "Pescado con papas"), t("Breaded fish with fries and tartar sauce.", "Pescado empanizado con papas fritas y salsa tártara."), 13.99),
  I("starters", t("Chicken Tenders", "Tiras de pollo"), t("Three hand-breaded tenders with fries.", "Tres tiras de pollo empanizadas a mano con papas fritas."), 11.99),
  I("starters", t("Caprese Salad", "Ensalada caprese"), t("Fresh tomatoes with fresh mozzarella and basil.", "Tomate fresco con mozzarella fresca y albahaca."), 10.99, { tags: V }),
  I("starters", t("Mozzarella Sticks", "Palitos de mozzarella"), t("Homemade, with marinara on the side.", "Hechos en casa, con marinara aparte."), 10.99, { tags: V, image: "/img/mozz-sticks.jpg" }),
  I("starters", t("Zucchini Sticks", "Palitos de calabacita"), t("Homemade and hand-breaded.", "Hechos en casa y empanizados a mano."), 11.53, { tags: V }),
  I("starters", t("Jalapeño Poppers", "Jalapeños rellenos"), t("Breaded jalapeños stuffed with cheddar.", "Jalapeños empanizados rellenos de cheddar."), 11.53, { tags: ["vegetarian", "spicy"] }),
  I("starters", t("Beef Samosas", "Samosas de res"), t("Baked dough filled with ground beef, cheese and onions.", "Masa horneada rellena de carne molida, queso y cebolla."), 9.99),
  I("starters", t("Spinach Samosas", "Samosas de espinaca"), t("Baked dough filled with chopped spinach.", "Masa horneada rellena de espinaca picada."), 9.99, { tags: V }),
  I("starters", t("Pizzerolla", "Pizzerolla"), t("Garlic bread topped with marinara, pepperoni and mozzarella.", "Pan de ajo con marinara, pepperoni y mozzarella."), 9.99),
  I("starters", t("Steak Cut Fries", "Papas gruesas"), t("", ""), 6.28, { tags: V }),
  I("starters", t("French Fries", "Papas fritas"), t("", ""), 4.99, { tags: V }),

  // ---------- Salads ----------
  I("salads", t("Garden Salad", "Ensalada de la casa"), t("Lettuce, carrots, garbanzo beans, tomatoes and cucumbers.", "Lechuga, zanahoria, garbanzos, tomate y pepino."), SIZES.salad(10.99, 14.99), { tags: V, modifiers: [DRESSING] }),
  I("salads", t("Caesar Salad", "Ensalada César"), t("Romaine, shredded parmesan and croutons.", "Lechuga romana, parmesano rallado y crutones."), SIZES.salad(10.99, 14.99), { image: "/img/caesar.jpg", featured: true, addons: [addon("chk", "Add chicken", "Agregar pollo", 3.99)] }),
  I("salads", t("Spinach Salad", "Ensalada de espinaca"), t("Spinach, mushrooms, onions, tomatoes, cucumbers and bacon bits.", "Espinaca, champiñones, cebolla, tomate, pepino y trocitos de tocino."), SIZES.salad(12.99, 17.99), { modifiers: [DRESSING] }),
  I("salads", t("Cobb Salad", "Ensalada Cobb"), t("Chopped lettuce, cucumbers, tomatoes, mozzarella, hard-boiled egg and turkey.", "Lechuga picada, pepino, tomate, mozzarella, huevo cocido y pavo."), SIZES.salad(13.99, 18.88), { modifiers: [DRESSING] }),
  I("salads", t("Antipasto Salad", "Ensalada antipasto"), t("Lettuce, tomatoes, bell peppers, onions, black olives, Italian meats and mozzarella.", "Lechuga, tomate, pimiento, cebolla, aceitunas negras, carnes frías italianas y mozzarella."), SIZES.salad(13.99, 17.99), { image: "/img/antipasto.jpg", modifiers: [DRESSING] }),
  I("salads", t("Chef Salad", "Ensalada del chef"), t("Lettuce, tomatoes, cucumbers, ham, turkey, garbanzo beans, mozzarella and hard-boiled egg.", "Lechuga, tomate, pepino, jamón, pavo, garbanzos, mozzarella y huevo cocido."), SIZES.salad(13.99, 17.99), { image: "/img/chef-salad.jpg", modifiers: [DRESSING] }),
  I("salads", t("Greek Salad", "Ensalada griega"), t("Lettuce, onions, bell peppers, black olives, mushrooms, tomatoes, cucumbers, artichoke hearts, salami and feta.", "Lechuga, cebolla, pimiento, aceitunas negras, champiñones, tomate, pepino, corazones de alcachofa, salami y feta."), SIZES.salad(14.99, 18.99), { modifiers: [DRESSING] }),
  I("salads", t("Blue Cheese & Walnut Salad", "Ensalada de queso azul y nuez"), t("Lettuce, onions, mushrooms, cucumbers, sun-dried tomatoes, blue cheese, walnuts and raisins.", "Lechuga, cebolla, champiñones, pepino, tomate deshidratado, queso azul, nuez y pasas."), SIZES.salad(14.99, 18.99), { tags: V, modifiers: [DRESSING] }),
  I("salads", t("Tuna Salad", "Ensalada de atún"), t("Spring mix, onions, tomatoes, cucumbers, sun-dried tomatoes, avocado and tuna.", "Mezcla de hojas verdes, cebolla, tomate, pepino, tomate deshidratado, aguacate y atún."), SIZES.salad(13.99, 17.99), { modifiers: [DRESSING] }),
  I("salads", t("Fratelli's Favorite Salad", "Ensalada favorita Fratelli's"), t("Lettuce, spinach, green and black olives, artichoke hearts, avocado, garbanzo beans, turkey, tomatoes and cucumbers.", "Lechuga, espinaca, aceitunas verdes y negras, corazones de alcachofa, aguacate, garbanzos, pavo, tomate y pepino."), SIZES.salad(14.99, 18.99), { modifiers: [DRESSING] }),
  I("salads", t("Salmon Salad", "Ensalada de salmón"), t("Large only. Spring mix, green olives, sun-dried tomatoes, onions, tomatoes, cucumbers, mozzarella and nuts.", "Solo grande. Mezcla de hojas verdes, aceitunas verdes, tomate deshidratado, cebolla, tomate, pepino, mozzarella y nueces."), 22.99, { modifiers: [DRESSING] }),

  // ---------- Sandwiches ----------
  ...[
    ["Chicken Parmesan", "Pollo a la parmesana", "Breaded chicken with marinara and mozzarella.", "Pollo empanizado con marinara y mozzarella."],
    ["Meatball", "Albóndiga", "Homemade meatballs with marinara and mozzarella.", "Albóndigas caseras con marinara y mozzarella."],
    ["Eggplant Parmesan", "Berenjena a la parmesana", "Breaded eggplant with marinara and mozzarella.", "Berenjena empanizada con marinara y mozzarella.", V],
    ["Philly Cheese Steak", "Philly cheese steak", "Steak sautéed with onions, mushrooms and mozzarella.", "Bistec salteado con cebolla, champiñones y mozzarella."],
    ["Pepper Steak", "Bistec con pimiento", "Steak sautéed with onions, bell peppers and mozzarella.", "Bistec salteado con cebolla, pimiento y mozzarella."],
    ["Sausage & Peppers", "Salchicha con pimiento", "Link sausage sautéed with onions, bell peppers and mozzarella.", "Salchicha salteada con cebolla, pimiento y mozzarella."],
    ["Pesto Chicken", "Pollo al pesto", "Pesto spread, chicken, lettuce, tomato and mozzarella.", "Pesto, pollo, lechuga, tomate y mozzarella."],
    ["Chicken Fajita", "Fajita de pollo", "Chicken, tomato, onion, mushrooms, peppers and mozzarella.", "Pollo, tomate, cebolla, champiñones, pimiento y mozzarella."],
    ["Grilled Chicken", "Pollo a la parrilla", "Chicken breast, mayo, garlic butter, lettuce, onion, tomato and mozzarella.", "Pechuga de pollo, mayonesa, mantequilla de ajo, lechuga, cebolla, tomate y mozzarella."],
    ["Cajun Chicken", "Pollo cajún", "Chicken in Cajun spices, mayo, garlic, lettuce, onions, tomato and mozzarella.", "Pollo con especias cajún, mayonesa, ajo, lechuga, cebolla, tomate y mozzarella.", S],
    ["Italian Cold Cut", "Carnes frías italianas", "Italian dressing, lettuce, onions and tomato.", "Aderezo italiano, lechuga, cebolla y tomate.", [], "/img/italian-cold-cut.jpg"],
    ["Ham & Cheese", "Jamón y queso", "Mayo, mustard, lettuce, onion and tomato.", "Mayonesa, mostaza, lechuga, cebolla y tomate."],
    ["Turkey & Cheese", "Pavo y queso", "Mayo, mustard, lettuce, onions and tomato.", "Mayonesa, mostaza, lechuga, cebolla y tomate."],
    ["Pastrami", "Pastrami", "Mustard, onions, pickles and mozzarella.", "Mostaza, cebolla, pepinillos y mozzarella."],
    ["Tuna", "Atún", "Mayo, mustard, onion, tomato and mozzarella.", "Mayonesa, mostaza, cebolla, tomate y mozzarella."],
    ["Vegetarian", "Vegetariano", "Mayo, bell peppers, mushrooms, onions, tomatoes and black olives, sautéed and topped with mozzarella.", "Mayonesa, pimiento, champiñones, cebolla, tomate y aceitunas negras salteados con mozzarella.", V],
  ].map(([en, es, den, des, tags = [], image]) => I("sandwiches", t(`${en} Sandwich`, `Sándwich de ${es.charAt(0).toLowerCase()}${es.slice(1)}`), t(den, des), SANDWICH_SIZES, { tags, image, addons: SANDWICH_ADDONS })),

  // ---------- Calzones ----------
  I("calzones", t("Fratelli's Favorite Calzone", "Calzone favorito Fratelli's"), t("Mozzarella, chicken, basil and feta.", "Mozzarella, pollo, albahaca y feta."), 14.99, { image: "/img/calzone.jpg", modifiers: [CALZONE_STYLE] }),
  I("calzones", t("Fratelli's Favorite Stromboli", "Stromboli favorito Fratelli's"), t("Mozzarella, pepperoni, sausage, mushrooms, olives, bell peppers and onions.", "Mozzarella, pepperoni, salchicha, champiñones, aceitunas, pimiento y cebolla."), 14.99, { image: "/img/stromboli.jpg" }),
  I("calzones", t("Meat Lovers Calzone", "Calzone amante de la carne"), t("Ricotta, mozzarella, ham, pepperoni, sausage and meatballs.", "Ricotta, mozzarella, jamón, pepperoni, salchicha y albóndigas."), 13.99, { modifiers: [CALZONE_STYLE] }),
  I("calzones", t("Spicy Chicken Calzone", "Calzone de pollo picante"), t("Ricotta, mozzarella, buffalo chicken, onions and bell peppers.", "Ricotta, mozzarella, pollo búfalo, cebolla y pimiento."), 14.68, { tags: S, modifiers: [CALZONE_STYLE] }),
  I("calzones", t("Sausage & Peppers Calzone", "Calzone de salchicha y pimiento"), t("Ricotta, mozzarella, sausage, onions and bell peppers.", "Ricotta, mozzarella, salchicha, cebolla y pimiento."), 13.99, { modifiers: [CALZONE_STYLE] }),
  I("calzones", t("BBQ Chicken Calzone", "Calzone de pollo BBQ"), t("Ricotta, mozzarella, BBQ grilled chicken, onions and bell peppers.", "Ricotta, mozzarella, pollo BBQ a la parrilla, cebolla y pimiento."), 13.99, { modifiers: [CALZONE_STYLE] }),
  I("calzones", t("Spinach Calzone", "Calzone de espinaca"), t("Ricotta, mozzarella, onions and spinach.", "Ricotta, mozzarella, cebolla y espinaca."), 12.99, { tags: V, modifiers: [CALZONE_STYLE] }),
  I("calzones", t("Three Cheese Calzone", "Calzone tres quesos"), t("Add any topping for $1 each.", "Agrega cualquier ingrediente por $1 cada uno."), 10.99, { tags: V, modifiers: [CALZONE_STYLE], addons: [addon("top", "Extra topping", "Ingrediente extra", 1)] }),

  // ---------- Kids ----------
  ...[
    ["Alfredo Pasta", "Pasta Alfredo", V],
    ["Baked Mostaccioli", "Mostaccioli al horno"],
    ["Spaghetti Marinara", "Espagueti marinara", V],
    ["Mac 'n' Cheese", "Macarrones con queso", V],
    ["Personal Pizza", "Pizza personal", V],
    ["Small Pizzerolla", "Pizzerolla chica"],
    ["Chicken Tenders", "Tiras de pollo"],
    ["Quesadilla", "Quesadilla", V],
    ["Ham & Cheese Sandwich", "Sándwich de jamón y queso"],
  ].map(([en, es, tags = []]) => I("kids", t(`Kids ${en}`, `${es} infantil`), t("", ""), 8.99, {
    tags: [...tags, "kids"],
    addons: en === "Personal Pizza" ? [addon("top", "Extra topping", "Ingrediente extra", 1)] : [],
  })),

  // ---------- Desserts ----------
  I("desserts", t("Tiramisu", "Tiramisú"), t("Creamy tiramisu finished with powdered sugar.", "Tiramisú cremoso con azúcar glass."), 7.99, { image: "/img/tiramisu.jpg", featured: true }),
  I("desserts", t("Cannolis", "Cannolis"), t("Two crisp pastry shells with a sweet cream filling.", "Dos conchas crujientes rellenas de crema dulce."), 8.99),
  I("desserts", t("Churro Cheesecake", "Pay de queso de churro"), t("Seasonal. Homemade churro-flavored cheesecake.", "De temporada. Pay de queso casero sabor churro."), 8.99, { image: "/img/churro-cheesecake.jpg" }),
  I("desserts", t("New York Cheesecake", "Pay de queso estilo Nueva York"), t("Classic and creamy.", "Clásico y cremoso."), 6.99, { image: "/img/cheesecake.jpg" }),
  I("desserts", t("Chocolate Mousse Cake", "Pastel de mousse de chocolate"), t("Fluffy chocolate mousse with a ganache filling.", "Mousse de chocolate esponjoso con relleno de ganache."), 6.99, { image: "/img/chocolate-mousse.jpg" }),
  I("desserts", t("Fried Ice Cream", "Helado frito"), t("", ""), 8.38),
  I("desserts", t("Ice Cream & Strawberry Pie", "Pay de helado y fresa"), t("", ""), 8.38),
  I("desserts", t("Spumoni Ice Cream", "Helado spumoni"), t("Chocolate, pistachio and cherry.", "Chocolate, pistache y cereza."), 6.99),

  // ---------- Catering ----------
  ...[
    ["Cheese Lasagna Tray", "Charola de lasaña de queso", 60, 105],
    ["Veggie, Beef, Chicken or Sausage Lasagna Tray", "Charola de lasaña de verduras, res, pollo o salchicha", 70, 120],
    ["Stuffed Shells Tray", "Charola de conchas rellenas", 60, 105],
    ["Cheese Ravioli Tray", "Charola de ravioles de queso", 60, 105],
    ["Meat Ravioli Tray", "Charola de ravioles de carne", 70, 120],
    ["Lobster Ravioli Tray", "Charola de ravioles de langosta", 85, 160],
    ["Spinach Ravioli Tray", "Charola de ravioles de espinaca", 70, 120],
    ["Pasta with Marinara, Meat Sauce or Garlic & Butter", "Pasta con marinara, boloñesa o ajo y mantequilla", 45, 80, true],
    ["Pasta with Alfredo, Pomodoro, Clam, Pink Sauce or Pesto", "Pasta con Alfredo, pomodoro, almeja, salsa rosa o pesto", 60, 100, true],
    ["Garden or Caesar Salad Tray", "Charola de ensalada de la casa o César", 35, 55],
    ["Chicken Caesar Salad Tray", "Charola de ensalada César con pollo", 40, 65],
    ["Greek Salad Tray", "Charola de ensalada griega", 45, 70],
    ["Chicken or Eggplant Parmesan Tray", "Charola de pollo o berenjena a la parmesana", 65, 120],
    ["Chicken Piccata Tray", "Charola de pollo piccata", 65, 120],
    ["Salmon Piccata Tray", "Charola de salmón piccata", 85, 170],
    ["Sautéed Veggies Tray", "Charola de verduras salteadas", 35, 60],
    ["Sausage & Peppers or Meatballs Tray", "Charola de salchicha con pimiento o albóndigas", 50, 95],
  ].map(([en, es, h, f, pasta]) => I("catering", t(en, es), t("", ""), SIZES.tray(h, f), pasta ? {
    modifiers: [group("pasta", t("Choose your pasta", "Elige tu pasta"), [["Spaghetti", "Espagueti"], ["Fettuccini", "Fettuccini"], ["Mostaccioli", "Mostaccioli"], ["Linguini", "Linguini"], ["Rigatoni", "Rigatoni"], ["Angel hair", "Cabello de ángel"]])],
    addons: en.includes("Marinara")
      ? [addon("meat", "Add meat, veggies or bay shrimp (half/full +$15/+$20)", "Agregar carne, verduras o camarón (media/completa +$15/+$20)", 15), addon("jumbo", "Add jumbo shrimp (half/full +$25/+$35)", "Agregar camarón jumbo (media/completa +$25/+$35)", 25)]
      : [addon("meat", "Add meat, veggies, bay shrimp or chicken (half/full +$15/+$20)", "Agregar carne, verduras, camarón o pollo (media/completa +$15/+$20)", 15), addon("jumbo", "Add jumbo shrimp (half/full +$25/+$40)", "Agregar camarón jumbo (media/completa +$25/+$40)", 25)],
  } : {})),

  // ---------- Beverages (hidden until the owner sets real prices) ----------
  ...[
    ["Fountain Soda", "Refresco de máquina"],
    ["Iced Tea", "Té helado"],
    ["Lemonade", "Limonada"],
    ["Bottled Water", "Agua embotellada"],
  ].map(([en, es]) => I("beverages", t(en, es), t("", ""), 0, { visible: false })),
];

export const banners = [
  { image: "/img/pizza-combo.jpg", title: t("Lunch specials, $13.99", "Especiales de almuerzo, $13.99"), subtitle: t("Pasta, pizza or sandwich, with soup or salad.", "Pasta, pizza o sándwich, con sopa o ensalada."), link_type: "category", link_ref: "lunch-specials" },
  { image: "/img/chef.webp", title: t("Scratch-made in North Hills", "Hecho en casa en North Hills"), subtitle: t("Family recipes, made to order.", "Recetas de familia, preparadas al momento."), link_type: "category", link_ref: "pizza" },
  { image: "/img/chicken-parm.jpg", title: t("Feeding a crowd?", "¿Una fiesta?"), subtitle: t("Catering trays for 10 to 24 people.", "Charolas para 10 a 24 personas."), link_type: "category", link_ref: "catering" },
];

export const restaurant = {
  name: "Fratelli's Italian Restaurant",
  tagline: t("Scratch-made Italian food in the heart of the Valley.", "Comida italiana hecha en casa en el corazón del Valle."),
  logo_url: "/img/logo.png",
  brand_primary: "#b8262b",
  brand_accent: "#2f6b2f",
  base_currency: "USD",
  default_language: "en",
  enabled_languages: ["en", "es"],
  enabled_currencies: ["USD", "MXN", "EUR", "CAD", "GBP"],
  timezone: "America/Los_Angeles",
  hours: [
    { days: [0, 1, 2, 3, 4], open: "10:30", close: "22:00" },
    { days: [5, 6], open: "10:30", close: "23:00" },
  ],
  address: "16153 Parthenia St, North Hills, CA 91343",
  map_url: "https://www.google.com/maps/search/?api=1&query=16153+Parthenia+St+North+Hills+CA+91343",
  phone: "(818) 893-9233",
  whatsapp: "",
  email: "info@fratellispizza.com",
  website: "https://fratellispizzanorthhills.com",
  social: {
    instagram: "https://www.instagram.com/fratellispizzanh/",
    facebook: "https://www.facebook.com/profile.php?id=100068687774274",
    tiktok: "https://www.tiktok.com/@fratellisnorthhills",
  },
  rate_max_age_hours: 48,
  allergen_standard: "us9",
  glossary: ["Alfredo", "Bruschetta", "Calzone", "Stromboli", "Tiramisu", "Cannoli", "Pomodoro", "Piccata", "Marinara", "Primavera", "Mostaccioli", "Manicotti", "Pizzerolla", "Caprese", "Antipasto", "Spumoni", "Fettuccini", "Linguini", "Penne", "Ravioli", "Lasagna", "Pesto", "Philly Cheese Steak", "Fratelli's"],
};

export const specials = [
  // Example: Chicken Parmesan is the Tuesday special at $17.99 (edit or delete in the admin).
  { item: "Chicken Parmesan", days: [2], special_price: 17.99, note: t("Tuesday special", "Especial del martes") },
];
