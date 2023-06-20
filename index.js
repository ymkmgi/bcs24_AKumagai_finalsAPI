// load the expressjs module into our app and into the express variable
const express = require('express');

// create an application with expressjs
// app is the server
const app = express();

const port = 4000;

// express.json() allows us to handle the request's body and automatically parse the incoming JSON to a JS object we can access and manage
app.use(express.json());

let users = [
    {
        email: "yumimori22@gmail.com",
        username: "ymkmgi",
        password: "cutie",
        isAdmin: true
    },
    {
        email: "shaimori@gmail.com",
        username: "smmr",
        password: "wow",
        isAdmin: false
    }
];
let items = [
    {
        "name": "Herbal Essence Shower Gel",
        "description": "Refreshing shower gel",
        "price": 199.99,
        "isActive": true
    },
    {
        "name": "Coco Loco Body Wash",
        "description": "Exotic coconut-scented body wash",
        "price": 149.50,
        "isActive": false
    }
];
let loggedUser;
let orders = [];

// register
app.post('/users', (req, res) => {
    console.log(req.body);
    // simulate the creation of new user account
    let newUser = {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        isAdmin: req.body.isAdmin || false
    };

    // Check if the username or email already exists in the user database
    const existingUser = users.find(user => user.email === req.body.email || user.username === req.body.username);
    if (existingUser) {
        res.status(400).send('Username or Email already exists.');
        return;
    }

    users.push(newUser);
    console.log(users);

    res.send('Registered Successfully!')
});

// login
app.post('/users/login', (req, res) => {
    // should contain username and password
    console.log(req.body);

    // find the user with the same username and password from our request body
    let foundUser = users.find((user) => {
        return user.username === req.body.username && user.password === req.body.password;
    });

    if (foundUser !== undefined) {
        let founderUserIndex = users.findIndex((user) => {
            return user.username === foundUser.username
        });

        foundUser.index = founderUserIndex;

        loggedUser = foundUser
        console.log(loggedUser);

        res.send('Thank you for logging in.')
    } else {
        loggedUser = foundUser;
        res.send('Login failed. Wrong credentials')
    }
});

// Middleware function to check if the user is logged in
const checkLoggedIn = (req, res, next) => {
    if (loggedUser) {
        // If the user is logged in, proceed to the next middleware or route handler
        next();
    } else {
        // If the user is not logged in, send an error response
        res.status(401).send('Unauthorized. Please log in.');
    }
};

// Set user as admin
app.put('/users/admin/:index', checkLoggedIn, (req, res) => {
    console.log(req.params);
    console.log(req.params.index);
    let userIndex = parseInt(req.params.index);
    
    if (loggedUser.isAdmin === true) {
        users[userIndex].isAdmin = true;
        console.log(users[userIndex]);
        res.send('User is now Admin')
    } else {
        res.send('Unathorized. User is Non-admin. Action Forbidden')
    }
});

// add items
app.post('/items', checkLoggedIn, (req, res) => {
    // console.log(loggedUser);
    console.log(req.body);

    if (loggedUser.isAdmin === true) {
        let newItem = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            isActive: req.body.isActive || true,
            createdOn: req.body.createdOn || new Date()
        }
        items.push(newItem);
        console.log(items);

        res.send('You have added a new item.');
    } else {
        res.send('Unathorized. Action Forbidden.');
    }
});

// get all items
app.get('/items', checkLoggedIn, (req, res) => {
    console.log(loggedUser);
    res.send(items);
});

// get all active items
app.get('/items/active', checkLoggedIn, (req, res) => {
    const activeItems = items.filter(item => item.isActive === true);
    res.send(activeItems);
});

// get specific item
app.get('/items/:index', checkLoggedIn, (req, res) => {
    console.log(req.params);
    console.log(req.params.index);
    let index = parseInt(req.params.index);
    let item = items[index];
    res.send(item)
});

// archive item
app.put('/items/archive/:index', checkLoggedIn, (req, res) => {
    console.log(req.params);
    console.log(req.params.index);
    let itemIndex = parseInt(req.params.index);
    if (loggedUser.isAdmin === true) {
        items[itemIndex].isActive = false;
        console.log(items[itemIndex]);
        res.send('Item Archived')
    } else {
        res.send('Unathorized. Action Forbidden.');
    }
});

// Update Product information
app.put('/items/info/:index', (req, res) => {
    if (loggedUser.isAdmin === true) {
        console.log(req.params);
        console.log(req.params.index);
        let itemIndex = parseInt(req.params.index);

        // check if the item index is valid
        if (itemIndex < 0 || itemIndex >= items.length) {
            res.status(404).send('item not found.');
            return;
        }

        // Update description field of the item
        items[itemIndex].description = req.body.description;

        console.log(items[itemIndex]);
        res.send('Item description updated.');
    } else {
        res.send('Unathorized. Non-admin user. Action Forbidden');
    }
});

// create order
app.post('/order', (req, res) => {
    if (loggedUser.isAdmin === false) {
        console.log(req.body);

        const selectedProduct = req.body.products;
        // Find the item in the items array that matches the selected product
        const matchedItem = items.find(item => item.name.toLowerCase().includes(selectedProduct.toLowerCase()));

        // Check if the selected product has a match in the items array
        if (!matchedItem) {
            res.status(400).send('Invalid product.');
            return;
        }

        if (!matchedItem.isActive) {
            res.status(400).send('Inactive product. Cannot be added to the cart.');
            return;
        }

        let newOrder = {
            userId: loggedUser.username,
            products: [matchedItem],
            price: matchedItem.price,
            quantity: req.body.quantity,
            purchasedOn: req.body.purchasedOn || new Date()
        };

        orders.push(newOrder);
        // check if pushed successfully
        console.log(orders);

        res.send('You have created a new order!');
    } else {
        res.send('Unauthorized. Admin user. Action Forbidden');
    }
});

// Get added products
app.get('/cart/products', (req, res) => {
    if (loggedUser) {
        // Find the orders belonging to the logged-in user
        const userOrders = orders.filter(order => order.userId === loggedUser.username);

        // Extract the products from each order
        const userProducts = userOrders.flatMap(order => {
            return order.products.map(product => {
                return {
                    ...product,
                    quantity: order.quantity
                };
            });
        });

        console.log(userProducts);
        res.send(userProducts);
    } else {
        res.send('Unauthorized. Admin user. Action Forbidden');
    }
});

// Update Quantity
app.put('/cart/update/:index', (req, res) => {
    if (loggedUser) {
        const orderIndex = parseInt(req.params.index);

        // Check if the order index is valid
        if (orderIndex < 0 || orderIndex >= orders.length) {
            res.status(404).send('Order not found.');
            return;
        }

        // Update the product quantity in the specified order
        orders[orderIndex].quantity = req.body.quantity;

        res.send('Product quantity updated successfully.');
    } else {
        res.status(401).send('Unauthorized. Please log in.');
    }
});

// Remove products from the cart
app.delete('/cart/remove/:index', (req, res) => {
    if (loggedUser) {
        const orderIndex = parseInt(req.params.index);

        // Find the orders belonging to the logged-in user
        const userOrders = orders.filter(order => order.userId === loggedUser.username);

        // Check if the order index is valid
        if (orderIndex < 0 || orderIndex >= userOrders.length) {
            res.status(404).send('Order not found.');
            return;
        }

        // Remove the product from the specified order
        userOrders[orderIndex].products.splice(0, 1);

        res.send(`Product removed from the cart.`);
    } else {
        res.status(401).send('Unauthorized. Please log in.');
    }
});

// Compute subtotal for each item
app.get('/cart/subtotal', (req, res) => {
    if (loggedUser) {
        const userOrders = orders.filter(order => order.userId === loggedUser.username);

        const cartItems = userOrders.flatMap(order => {
            return order.products.map(product => {
                const subtotal = product.price * order.quantity;
                return {
                    ...product,
                    subtotal
                };
            });
        });

        res.json(cartItems);
    } else {
        res.status(401).send('Unauthorized. Please log in.');
    }
});

// Compute total price for all items in the cart
app.get('/cart/totalprice', (req, res) => {
    if (loggedUser) {
        const userOrders = orders.filter(order => order.userId === loggedUser.username);

        let totalPrice = 0;

        userOrders.forEach(order => {
            order.products.forEach(product => {
                totalPrice += product.price * order.quantity;
            });
        });

        res.send(`Total price for all items in the cart: $${totalPrice.toFixed(2)}`);
    } else {
        res.status(401).send('Unauthorized. Please log in.');
    }
});

// get all orders
app.get('/order/allOrders', (req, res) => {
    console.log(req.body);
    if (loggedUser.isAdmin === true) {
        res.send(orders);
    } else {
        res.send('Unathorized. Non-admin user. Action Forbidden');
    }
});

// get authenticated user's orders
app.get('/order/userOrder', checkLoggedIn, (req, res) => {
    if (loggedUser.isAdmin === true) {
        // Filter the orders based on the user's email
        const userOrders = orders.filter(order => order.email === loggedUser.email);
        res.send(userOrders);
    } else {
        res.status(403).send('Unauthorized. Action Forbidden.');
    }
});

app.listen(port, () => console.log(`Server is running at port ${port}`));