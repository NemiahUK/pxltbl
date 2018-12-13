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
    User=pi

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


 
