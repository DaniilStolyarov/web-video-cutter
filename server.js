const express = require("express");
const app = express();

app.use((req,res,next) =>
{
    res.append('Cross-Origin-Opener-Policy',  'same-origin');
    res.append('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
})
app.use(express.static("front"))

app.listen(process.env.PORT || 5000, (err) => 
{
    if (err)
    console.log(err)
}
);