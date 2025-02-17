var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  let products=[{
    name:"IPHONE 11",
    category:"Mobile",
    description:"This is a good phone",
    image:"https://i0.wp.com/www.smartprix.com/bytes/wp-content/uploads/2023/02/10-photoutils.com_.jpeg?ssl=1"
  },
  {
    name:"Macbook",
    category:"Laptop",
    description:"5 stars",
    image:"https://th.bing.com/th/id/OIP.KNNMzf7HluBHIGVgRzPobQHaE8?rs=1&pid=ImgDetMain"
  },
  {
    name:"Beats Solo3",
    category:"Headset",
    description:"Good sound quality",
    image:"https://th.bing.com/th/id/OIP.b-O3wMtgy3K-0Q-te3ocoQHaHa?rs=1&pid=ImgDetMain"
  },
  {
    name:"Apple watch",
    category:"Watch",
    description:"Good smart smartwatch",
    image:"https://th.bing.com/th/id/R.5c0f7e3ad23f01f64f3b0870295b7d27?rik=0SIbC2Ryq%2f0PcA&pid=ImgRaw&r=0"
  }
]
  res.render('index',{products})
});

module.exports = router;
