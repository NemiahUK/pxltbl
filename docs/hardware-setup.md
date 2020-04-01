# RasPi Setup
## Enable audio over I2S

Follow the instructions here: https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-usage


## Set screen res to 1600x900
Why? becasue this works really well for VNC on a 1080p monitor and is wide enough to display the LED buffer.

add the following to /boot/config.txt: 

    hdmi_group=2
    hdmi_mode=83



## RasPi config:

* Enable SSH
* Enable VNC
* Enable I2C
* Enable SPI
* Enable Serial Port
* Disable Serial Console

## Other config

Disable boot info (this is usually already done), edit this file: `/boot/cmdline.txt` and look for something like this
    `dwc_otg.lpm_enable=0 console=serial0,115200 console=tty1 root=/dev/mmcblk0p6 rootfstype=ext4 elevator=deadline rootwait`

Delete the `console=serail0,115200` part.

## Enable auto run as service

Find out where npm is installed by typing `which npm` it should return `/usr/bin/npm` or `/usr/local/bin/npm` make a note of this.

Create the service file...

    sudo nano /etc/systemd/system/pxltbl.service

Paste the following:

    [Unit]
    Description=Pixel Table service
    After=network.target

    [Service]
    ExecStart=/usr/bin/npm start
    WorkingDirectory=/home/pi/pxltbl/api
    StandardOutput=inherit
    StandardError=inherit
    Restart=on-failure
    User=root

    [Install]
    WantedBy=multi-user.target

Change the line `ExecStart=/usr/bin/npm start` to match the npm path you noted down earlier.

Enable the service

    sudo systemctl enable pxltbl.service
   
Start the service

    sudo systemctl start pxltbl.service
    
If you want to view the logs

    journalctl -u pxltbl

## Install

### Prerequisites for node-hid

Compilation tools: 

    sudo apt-get install build-essential git

gcc-4.8+: 

    sudo apt-get install gcc-4.8 g++-4.8 && export CXX=g++-4.8

libusb-1.0-0 w/headers:

    sudo apt-get install libusb-1.0-0 libusb-1.0-0-dev

libudev-dev: 

    sudo apt-get install libudev-dev

### Arduino (in future this may be handled by node)

    sudo apt-get install arduino

### Arduino auto-reset script (in future this may be handled by node)

    cd ~
    wget https://github.com/SpellFoundry/avrdude-rpi/archive/master.zip
    sudo unzip master.zip
    cd ./avrdude-rpi-master/
    sudo cp autoreset /usr/bin
    sudo cp avrdude-autoreset /usr/bin
    sudo mv /usr/bin/avrdude /usr/bin/avrdude-original
    sudo ln -s /usr/bin/avrdude-autoreset /usr/bin/avrdude


 
## Reference

### GPIO Pins

                   3V3 -  1 2  - Arduino +5V
           Arduino SDA -  3 4  - Amp +5V
           Arduino SCL -  5 6  - Arduino GND
                       -  7 8  - Arduino UART Rx (Pin0)
               Amp GND -  9 10 - Arduino UART Tx (Pin1)
         Arduino Reset - 11 12 - Amp BCLK / Analog PWM L
             Button RT - 13 14 - GND
             Button TR - 15 16 - Button LB
            Button 3V3 - 17 18 - Button BL
                  MOSI - 19 20 - GND
                  MISO - 21 22 - Button LT
                  SCLK - 23 24 - CE0
                   GND - 25 26 - CE1
                       - 27 28 -
                       - 29 30 - GND
           Button Home - 31 32 - Button BR
          Analog PWM R - 33 34 - GND
             Amp LRCLK - 35 36 - Button RB
             Button TL - 37 38 - 
                   GND - 39 40 - Amp DIN
        