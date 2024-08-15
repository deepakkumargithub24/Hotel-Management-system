import express from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql2';

const app = express();
const port = 3000;

// Create a connection pool to the database
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hotel_management_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Login page back-end code 
// <--------------------------------------------------------------------------------->

app.get('/', (req, res) => {
  res.render('index.ejs');
});

app.post('/', (req, res) => { 
  const username1 = req.body.username;
  const password = req.body.password;
  const usertype = req.body.userType;
  
  let table = "";
  
  if(usertype == 'user')
    table = 'users';
  else if(usertype == 'admin')
    table = 'Admins';

  const sql = `SELECT COUNT(*) AS count FROM ${table} WHERE username = ? AND userPassword = ?`;

  pool.query(sql, [username1, password], (error, results) => {
    if (error) {
      console.error('Error executing query:', error.stack);
      res.status(500).send('Error querying database');
      return;
    }
    
    if (results[0].count > 0) {
      if(usertype == 'user')
        res.render('home.ejs');
      else if(usertype == 'admin') 
        res.render('admin.ejs');
    } else {
      res.render('index.ejs'); 
    }
  });
});

// <---------------------------------------------------------------------------------->
// Registration back-end code

app.get('/registration', (req, res) => {
  res.render('registration.ejs');
});

app.post('/registration', (req, res) => {
  const name = req.body.name;
  const username = req.body.rUsername;
  const email = req.body.email;
  const password = req.body.rPassword;

  const sql = 'INSERT INTO users (cname, username, email, userPassword) VALUES (?, ?, ?, ?)';

  pool.query(sql, [name, username, email, password], (error, results) => {
    if (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        // Duplicate entry error
        // console.error('Duplicate entry error:', error.stack);
        // res.status(400).send('Username or email already exists');
        res.render('registration.ejs', {data: "Username or email already exists"})
      } else {
        // Other errors
        // console.error('Error executing query:', error.stack);
        res.status(500).send('Error registering user');
      }
      return;
    }
    // res.status(200).send('User registered successfully');
    res.render('index.ejs');
  });
});

// <---------------------------------------------------------------------------------->

app.post('/booking', (req, res) => {
  const message = req.body.message;
  res.render('booking.ejs', {roomtype:message, count: null, checkin: null, checkout: null, results: null, alert: null});
})

// <------------------------------------------------------------------------------------>

app.get('/home', (req, res) => {
  res.render('home.ejs');
})

// <---------------------------------------------------------------------------------->

app.get('/facility', (req, res) => {
  res.render('facility.ejs');
})


// <-------------------------------------------------------------------------------->

app.get('/foods', (req, res) => {
  res.render('food.ejs');
})



// <--------------------------------------------------------------------------------------->

app.post('/check', (req, res) => {
  const checkbook = req.body.check_or_book;
  
  if (checkbook == 'check') {
    const checkin = req.body.checkin;
    const checkout = req.body.checkout;
    const roomtype = req.body.room;
  
    const sql = "SELECT room_number " +
            "FROM rooms " +
            "WHERE room_number NOT IN (" +
                "SELECT room_no " +
                "FROM bookings " +
                "WHERE NOT (" +
                    "check_out < ? OR check_in > ?" +
                ")" +
            ") AND room_type = ?";

  
    pool.query(sql, [checkin, checkout, roomtype], (error, results) => {
      if (error) {
        console.error('Error executing query:', error.stack);
        res.status(500).send('Error querying database');
        return;
      }
  
      const count = results.length;  // Count of available rooms
      // console.log(count);
      res.render('booking.ejs', { roomtype: roomtype, count: count, checkin: checkin, checkout: checkout, results: results, alert: null});
    });
  }

  else{
    const name = req.body.name;
    const age = req.body.age;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address; 
    const gender = req.body.gender; 
    const checkin = req.body.checkin;
    const checkout = req.body.checkout;
    const roomtype = req.body.roomtype;
    const card = req.body.card_number;
    const cvv = req.body.cvv_number;
    const room_number = req.body.room;

    const sql = "SELECT COUNT(*) AS count FROM payment WHERE card_number = ? and cvv_number = ?";
    
    pool.query(sql, [card, cvv], (error, results) => {
      if (error) {
        console.error('Error executing query:', error.stack);
        res.status(500).send('Error querying database');
        return;
      }
  
      const cnt = results[0].count;
      if(cnt > 0){
        const sql2 = "INSERT INTO bookings values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        pool.query(sql2, [name, age, email, phone, address, gender, room_number, checkin, checkout, roomtype], (error, results) => {
          if (error) {
            console.error('Error executing query:', error.stack);
            res.status(500).send('Error querying database');
            return;
          }
          
        });

        let alertMessage = 'Room booked Succesfully';
        res.render('booking.ejs', { roomtype: roomtype, count: cnt, checkin: checkin, checkout: checkout, results: results, alert: alertMessage })

        // console.log(name, age, email, phone, address, gender, checkin, checkout, roomtype, room_number);
      }
      else{
        let alertMessage = 'Card Number or CVV Number is wrong';
        res.render('booking.ejs', { roomtype: roomtype, count: cnt, checkin: checkin, checkout: checkout, results: results, alert: alertMessage })
      }
      
    }); 
  }  
});




// Admin page backend <----------------------------------------------------------------->

app.get('/login' , (req, res) => {
  res.redirect('/');
})
// customer-detail web page backend <----------------------------------------------------->

app.get('/customer-detail', (req, res) => {

  const sql = "SELECT * FROM bookings";
  
  pool.query(sql, (error, results) => {
    if (error) {
      console.error('Error executing query:', error.stack);
      res.status(500).send('Error querying database');
      return;
    }
    res.render('customer_detail.ejs', {results: results});
  })
})

app.post('/customer-detail', (req, res) => {
  const room_number1 = req.body.message2;
  
  const sql = "DELETE FROM bookings WHERE room_no = ?";

  pool.query(sql, [room_number1], (error, results) => {
    if (error) {
      console.error('Error executing query:', error.stack);
      res.status(500).send('Error querying database');
      return;
    }

    res.redirect('/customer-detail');
  })
})



// employee details backend web page <------------------------------------------------------>

app.get('/employee-detail', (req, res) => {

  const sql = "SELECT * FROM employee";
  
  pool.query(sql, (error, results) => {
    if (error) {
      console.error('Error executing query:', error.stack);
      res.status(500).send('Error querying database');
      return;
    }
    res.render('employee_details.ejs', {results: results});
  })
})

app.post('/employee-detail', (req, res) => {
  const phone = req.body.message2;
  
  const sql = "DELETE FROM employee WHERE phone = ?";

  pool.query(sql, [phone], (error, results) => {
    if (error) {
      console.error('Error executing query:', error.stack);
      res.status(500).send('Error querying database');
      return;
    }

    res.redirect('/employee-detail'); 
  })
})



// add employee backend <------------------------------------------------------------------>

app.get('/add-employee', (req, res) => {
  res.render('add_employee.ejs', {message:null});
})

app.post('/add-employee', (req, res) => {
  const name = req.body.ename;
  const age = req.body.age;
  const email = req.body.email;
  const phone = req.body.phone;
  const address = req.body.address;
  const work_type = req.body.work_type;
  const gender = req.body.gender;

  const sql = "INSERT INTO employee values(?, ?, ?, ?, ?, ?, ?)";

  pool.query(sql, [name, age, email, phone, address, gender, work_type], (error, results) => {
    if (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.render('add_employee.ejs', {message: "Employee add already or phone number is same"})
      } 
      else {
        res.status(500).send('Error registering user');
      }
      return;
    }
    const message = 'Employee is added successfully';
    res.render('add_employee.ejs', {message: message});
  });

})



// add room backend <----------------------------------------------------------------------->

app.get('/add-room', (req, res) => {
  res.render('add_room.ejs', {message:null});
})

app.post('/add-room', (req, res) => {
  const id = req.body.id;
  const room_number = req.body.room_number;
  const type = req.body.room_type;
  
  const sql = "INSERT INTO rooms values(?, ?, ?)";

  pool.query(sql, [id, room_number, type], (error, results) => {
    if (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.render('add_room.ejs', {message: "This room id is already exists, Change it"})
      } 
      else {
        res.status(500).send('Error registering user');
      }
      return;
    }
    const message = 'Room is added successfully';
    res.render('add_room.ejs', {message: message});
  });
})




app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}`);
});
