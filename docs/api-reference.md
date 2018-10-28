# API Reference

## Drawing functions

### blank(r,g,b)
Fills the screen with the selected colour.

### setColor(r,g,b,[a])
Sets the drawing colour. `r,g,b` are values 0-255. `a` is optional, in the range of 0-1, default 1.0

### setColor(string)  *not yet implemented*
Sets the drawing colour.

String must be HTML/CSS Hex colour code. e.g. `#DECAFF`

### setColor({object})
Sets the drawing colour.

Possible object properties are...

RGB format

    {
        r : 0-255
        g : 0-255
        b : 0-255
        a : 0.0 - 1.0    //optional - default 1.0
    }
HSL format

    {
        h : 0-360
        s : 0-255
        l : 0-255
        a : 0.0 - 1.0    //optional - default 1.0
    }
HSV format

    {
        h : 0-360
        s : 0-255
        v : 0-255
        a : 0.0 - 1.0    //optional - default 1.0
    }

### setColorHsl(h,s,l,a)
Sets the drawing colour. `h` is 0-360, `s,l` are 0-255. `a` is optional, in the range of 0-1, default 1.0

### setColorHsv(h,s,v,a)
Sets the drawing colour. `h` is 0-360, `s,l` are 0-255. `a` is optional, in the range of 0-1, default 1.0

