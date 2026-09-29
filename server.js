const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

app.use(express.json());

// ==============================
// CORS
// ==============================

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

// ==============================
// SERVE WEBSITE
// ==============================

app.use(express.static(path.join(__dirname)));


// ==============================
// DATABASE
// ==============================

const db = new sqlite3.Database("./apxmart.db", (err) => {

    if (err) {
        console.log("Database error:", err.message);
        return;
    }

    console.log("Database connected!");

    createOrdersTable();
});


// ==============================
// CREATE ORDERS TABLE
// ==============================

function createOrdersTable() {

    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            total_amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {

        if (err) {
            console.log(
                "Orders table error:",
                err.message
            );
        } else {
            console.log(
                "Orders table ready!"
            );
        }

    });

}


// ==============================
// HOME
// ==============================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// ==============================
// GET ALL ORDERS
// ==============================

app.get("/api/orders", (req, res) => {

    db.all(
        "SELECT * FROM orders ORDER BY id DESC",
        [],
        (err, rows) => {

            if (err) {

                console.log(
                    "Order fetch error:",
                    err.message
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }

            res.json({
                success: true,
                orders: rows
            });

        }
    );

});


// ==============================
// CREATE ORDER
// ==============================

app.post("/api/orders", (req, res) => {

    const {
        customer_name,
        customer_email,
        total_amount,
        payment_method
    } = req.body;


    if (
        !customer_name ||
        !customer_email ||
        !total_amount ||
        !payment_method
    ) {

        return res.status(400).json({
            success: false,
            message: "All order details are required"
        });

    }


    db.run(
        `
        INSERT INTO orders
        (
            customer_name,
            customer_email,
            total_amount,
            payment_method
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            customer_name,
            customer_email,
            total_amount,
            payment_method
        ],

        function (err) {

            if (err) {

                console.log(
                    "Order creation error:",
                    err.message
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }


            res.status(201).json({

                success: true,

                message:
                    "Order created successfully",

                order_id: this.lastID

            });

        }
    );

});


// ==============================
// UPDATE ORDER STATUS
// ==============================

app.put("/api/orders/:id/status", (req, res) => {

    const orderId = req.params.id;

    const { status } = req.body;


    const allowedStatuses = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    ];


    if (!allowedStatuses.includes(status)) {

        return res.status(400).json({

            success: false,

            message:
                "Invalid order status"

        });

    }


    db.run(
        `
        UPDATE orders
        SET status = ?
        WHERE id = ?
        `,
        [
            status,
            orderId
        ],

        function (err) {

            if (err) {

                return res.status(500).json({

                    success: false,

                    message:
                        err.message

                });

            }


            if (this.changes === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found"

                });

            }


            res.json({

                success: true,

                message:
                    "Order status updated"

            });

        }
    );

});


// ==============================
// START SERVER
// ==============================

const PORT = process.env.PORT || 3000;

const server = app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log("==============================");
        console.log("APXMART SERVER STARTED");
        console.log("==============================");
        console.log("Port:", PORT);
        console.log("==============================");

    }
);


// ==============================
// SERVER ERROR
// ==============================

server.on("error", (error) => {

    console.log(
        "SERVER ERROR:",
        error.message
    );

});    
