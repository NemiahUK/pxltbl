# API Reference

## Drawing functions

### blank(r,g,b)
Fills the screen with the selected colour.

---

### setColor(r,g,b,[a])
Sets the drawing colour. 

`r,g,b` are values 0-255. `a` is optional, in the range of 0-1, default 1.0

---

### setColor(string)  *not yet implemented*
Sets the drawing colour.

String must be HTML/CSS Hex colour code. e.g. `#DECAFF`

---

### setColor(array)
Sets the drawing colour.

Expects an array of 3 or 4 elements...

    [0] = r    0-255
    [1] = g    0-255
    [2] = b    0-255
    [3] = a    0.0-1.0


### setColor(object)
Sets the drawing colour.

Possible object properties are...

RGB format

    {
        r : 0-255
        g : 0-255
        b : 0-255
        a : 0.0-1.0    //optional - default 1.0
    }
HSL format

    {
        h : 0-360
        s : 0-255
        l : 0-255
        a : 0.0-1.0    //optional - default 1.0
    }
HSV format

    {
        h : 0-360
        s : 0-255
        v : 0-255
        a : 0.0-1.0    //optional - default 1.0
    }

---

### setColorHsl(h,s,l,a)
Sets the drawing colour. 

`h` is 0-360, `s,l` are 0-255. `a` is optional, in the range of 0-1, default 1.0

---

### setColorHsv(h,s,v,a)
Sets the drawing colour. 

`h` is 0-360, `s,v` are 0-255. `a` is optional, in the range of 0-1, default 1.0

---

#### fillBox(x,y,w,y)

Draws a filled box at location `x,y` of width `w` and height `h`

---

### text(text,x,y)

Draws `text` starting with the upper left corner of the first character at location `x,y`.

Returns an object containing the width and height of the bounding box containing the text.

    {
        w : width,
        h : height
    }

---

## Helper functions


#### rgbToHsv(r,g,b)

---

#### hsvToRgb(h,s,v)

---

#### rgbToHsl(r,g,b)

---

#### hslToRgb(h,s,l)

To be continued....