const express = require('express');
const { connectToDb, getDb, client } = require('./db'); 
const { secret } = require('./config'); 
const path = require('path');
const fs = require('fs');
const PORT = 3000;
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./authMiddleware')

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));
app.use('/fonts', express.static(path.join(__dirname, '../frontend/fonts')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use(express.json());
let db;

connectToDb((err) => {
  if (!err) {
    app.listen(PORT, err => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Webpage runs on port ${PORT}`);
      }
    });
    db = getDb();
  } else {
    console.log(`There was an error: ${err}`);
    return;
  }
});

app.get('/', async (req, res) => {
  fs.createReadStream("../frontend/index.html").pipe(res);
});

app.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await client
      .db('users')
      .collection('users')
      .findOne({ name });

    if (!user) {
      return res.status(401).json({ error: `User "${name}" not found.`});
    }
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    const token = generateAccessToken(user._id);
    return res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log in' });
  }
});

app.post('/registration', async (req, res) => {
  try {
    const { newname, newpassword } = req.body; 
    if (!newname || !newpassword) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const existingUser = await client
      .db('users')
      .collection('users')
      .findOne({ name: newname });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this username already exists. Please choose another username.' });
    }
    const user = await client
      .db('users')
      .collection('users')
      .insertOne({ name: newname, password: newpassword });
    const token = generateAccessToken(user.insertedId);
    return res.json({ token, message: "You are signed up" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

app.get('/avatar', async (req, res) => {
  try {
    const username = req.query.username;
    const user = await client
      .db('users')
      .collection('users')
      .findOne({ name: username });
    if (!user || !user.avatar) {
    const newuser = await client
      .db('users')
      .collection('users')
      .findOne({ name: "default" });
     res.send(newuser.avatar);
    }
    else{
      res.send(user.avatar); 
    }
  } catch (error) {
    console.error('Error retrieving avatar:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/updateAvatar', async (req, res) => {
  try {
    const username = req.body.username;
    const avatar = req.body.avatar;
    await client
      .db('users')
      .collection('users')
      .updateOne({ name: username }, { $set: { avatar: avatar } });
    res.json({ message: 'Avatar updated successfully' });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

app.post('/updateUserData', async (req, res) => {
  try {
    const username = req.body.username;
    const userData = req.body.userData;
    console.log(userData)
    await client
      .db('users')
      .collection('users')
      .updateOne({ name: username }, { $set: { UserData: userData } });
    res.json({ message: 'Information updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update information' });
  }
});

app.get('/getaboutme', async (req, res) => {
  try {
    const username = req.query.username;
    const user = await client
      .db('users')
      .collection('users')
      .findOne({ name: username });
    if (!user.aboutme) {
     res.send("No information");
    }
    else{
      res.send(user.aboutme); 
    }
  } catch (error) {
    console.error('Error retrieving information:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/updateAboutMe', async (req, res) => {
  try {
    const username = req.body.username;
    const newAboutMe = req.body.newAboutMe;
    await client
      .db('users')
      .collection('users')
      .updateOne({ name: username }, { $set: { aboutme: newAboutMe } });
    res.json({ message: 'Information updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update information' });
  }
});

app.post('/deleteAvatar', async (req, res) => {
  try {
    const username = req.body.username;
    await client
      .db('users')
      .collection('users')
      .updateOne({ name: username }, { $unset: { avatar: "" } });
    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

app.get('/getDefaultAvatar', async (req, res) => {
  try {
    const defaultUser = await client
      .db('users')
      .collection('users')
      .findOne({ name: "default" });
     return res.send(defaultUser.avatar);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});


app.post('contacts', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await client
      .db('contacts')
      .collection('subscribers')
      .insertOne({ email });
    res.status(201).json({ message: 'Email sent successfully', data: result.ops });
  } catch (error) {
    console.error('Error saving email:', error);
    res.status(500).json({ error: 'Failed to save email' });
  }
});

app.get('/searchpage', (req, res) => {
  fs.createReadStream("../frontend/searchpage.html").pipe(res);
});

app.post('/contact_us', async (req, res) => {
  try {
    const { name, email, phonenumber, message } = req.body;
    const result = await client
      .db('contacts')
      .collection('contact_us')
      .insertOne({ name, email, phonenumber, message });
    res.status(201).json({ message: 'We will answer you later !', data: result.ops });
  } catch (error) {
    console.error('Error saving email:', error);
    res.status(500).json({ error: 'There was error. Please tell authors!' });
  }
});

app.get('/about', (req, res) => {
  fs.createReadStream("../frontend/about.html").pipe(res);
})

app.post('/about', async (req, res) => {
  try {
    const id = "1";
    const about = await client
      .db('website_information')
      .collection('about_us')
      .findOne({ id });
    const text = about.text;
    return res.json({ text });
  } catch (error) {
    res.status(500).json({ error: 'Error occured' });
  }
});


app.get('/blog', (req, res) => {
  fs.createReadStream("../frontend/blog.html").pipe(res);
})

app.get('/categories', (req, res) => {
  fs.createReadStream("../frontend/categories.html").pipe(res);
})

app.get('/contact', (req, res) => {
  fs.createReadStream("../frontend/contact.html").pipe(res);
})

app.get('/auth', (req, res) => {
  fs.createReadStream("../frontend/auth.html").pipe(res);
})

app.get('/profile', (req, res) => {
  fs.createReadStream("../frontend/profile.html").pipe(res);
})

app.get('/admin', (req, res) => {
  fs.createReadStream("../frontend/admin.html").pipe(res);
})

app.get('/get_counts', async (req, res) => {
  try {
      const userCollection = client.db('users').collection('users');
      const orderCollection = client.db('orders').collection('total');
      const subscribersCollection = client.db('contacts').collection('subscribers');
      const userCount = await userCollection.countDocuments();
      const orderCount = await orderCollection.countDocuments();
      const subscribersCount = await subscribersCollection.countDocuments();
      const profit = await calculateProfit(orderCollection);
      const counts = {
          users_count: userCount,
          orders_count: orderCount,
          profit: profit,
          subscribers_count: subscribersCount
      };
      res.json(counts);
  } catch(error) {
      console.error('Error occurred while fetching counts:', error);
      res.status(500).send('Internal Server Error');
  }
});

async function calculateProfit(collection) {
  try {
      const result = await collection.aggregate([
          { $group: { _id: null, totalProfit: { $sum: "$price" } } }
      ]).toArray();
      return result.length > 0 ? result[0].totalProfit : 0;
  } catch (error) {
      console.error('Error occurred while calculating profit:', error);
      return 0; 
  }
}

app.get('/region_counts', async (req, res) => {
  const db = client.db('orders'); 
    try {
        const regionCounts = await db.collection('total').aggregate([
            { $group: { _id: '$region', count: { $sum: 1 } } }
        ]).toArray();
      res.json(regionCounts);
  } catch (error) {
      res.status(500).send('Internal Server Error');
  }
});

app.get('/information', (req, res) => {
  fs.createReadStream("../frontend/admin/information.html").pipe(res);
})

app.get('/forms', (req, res) => {
  fs.createReadStream("../frontend/admin/forms.html").pipe(res);
})

app.get('/tables', (req, res) => {
  fs.createReadStream("../frontend/admin/tables.html").pipe(res);
})

const generateAccessToken = (id) =>{
  const payload = {
    id
  }
  return jwt.sign(payload, secret, {expiresIn: '5min'})
}
