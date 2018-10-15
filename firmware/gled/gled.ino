
//##############################################################################
//##############################################################################
//                                                                             #
// Glediator to WS2812 pixel converter                                         #
// by R. Heller                                                                #
// V 1.0 - 07.01.2014                                                          #            
// wwww.SolderLab.de                                                           #
//                                                                             #
// Receives serial data in Glediator protocol format @ 1 MBit/s                #
// and distributes it to a connectect chain of WS2812 pixels                   #
//                                                                             #
// Adjust the correct DATA PIN and the correct NUMBER OF PIXELS you are using  # 
// in the definitions section below before uploading this sketch to your       #
// Arduino device.                                                             #
//                                                                             #
// Maxiumim number of supported pixeles is 512 !!!                             #
//                                                                             #
// In the Glediator software set output mode to "Glediator_Protocol",          #
// color order to "GRB" and baud rate to "1000000"                             #
//                                                                             #
//##############################################################################
//##############################################################################


//##############################################################################
//                                                                             #
// Definitions --> Make changes ONLY HERE                                      #
//                                                                             #
// To find out the correct port, ddr and pin name when you just know the       #
// Arduino's digital pin number just google for "Arduino pin mapping".         #
// In the present example digital Pin 6 is used which corresponds to "PORTD",  #
// "DDRD" and "6", respectively.                                               #
//                                                                             #
//##############################################################################

#define DATA_PORT          PORTD
#define DATA_DDR           DDRD						
#define DATA_PIN           6							
#define NUMBER_OF_PIXELS   253

//====NOT CURRENTLY USED========
#define FCPU 16000000
#define baud 1000000
#define myubrr FCPU/16/baud - 1
//==============================

//##############################################################################
//                                                                             #
// Variables                                                                   #
//                                                                             #
//##############################################################################

unsigned char display_buffer[NUMBER_OF_PIXELS * 3];
static unsigned char *ptr;
static unsigned int pos = 0;

volatile unsigned char go = 0;


//##############################################################################
//                                                                             #
// Setup                                                                       #
//                                                                             #
//##############################################################################

void setup()
{

  //need to add a startup animation here,  then wait for signal from RasPi

  // Set data pin as output
  DATA_DDR |= (1 << DATA_PIN);


  // Initialize UART
  UCSR0A |= (1<<U2X0);
  UCSR0B |= (1<<RXEN0)  | (1<<TXEN0) | (1<<RXCIE0);
  UCSR0C |= (1<<UCSZ01) | (1<<UCSZ00)             ;
  UBRR0H = 0;
  UBRR0L = 1; //Baud Rate 1 MBit (at F_CPU = 16MHz)

  ptr=display_buffer;

  //Enable global interrupts
  sei();
}


//##############################################################################
//                                                                             #
// Main loop                                                                   #
//                                                                             #
//##############################################################################

void loop()
{
  if (go==1)
  {
    cli();
    ws2812_sendarray(display_buffer, NUMBER_OF_PIXELS * 3);
    sei();
    go=0;
  }
}


//##############################################################################
//                                                                             #
// UART-Interrupt-Prozedur (called every time one byte is compeltely received) #
//                                                                             #
//##############################################################################

ISR(USART_RX_vect)
{
  unsigned char b;
  b=UDR0;

  if (b == 1)  {pos=0; ptr=display_buffer; return;}
  if (pos == (NUMBER_OF_PIXELS*3)) {} else {*ptr=b; ptr++; pos++;}
  if (pos == ((NUMBER_OF_PIXELS*3)-1)) {go=1;}
}


//##############################################################################
//                                                                             #
// WS2812 output routine                                                       #
// Extracted from a ligh weight WS2812 lib by Tim (cpldcpu@gmail.com)          #
// Found on wwww.microcontroller.net                                           #
// Requires F_CPU = 16MHz                                                      #
//                                                                             #
//##############################################################################

void ws2812_sendarray(uint8_t *data,uint16_t datlen)
{
  uint8_t curbyte,ctr,masklo;
  uint8_t maskhi = _BV(DATA_PIN);
  masklo =~ maskhi & DATA_PORT;
  maskhi |= DATA_PORT;

  while (datlen--)
  {
    curbyte = *data++;

    asm volatile
    (
      "		ldi %0,8	\n\t"		// 0
      "loop%=:out %2, %3	\n\t"		// 1
      "lsl	%1		\n\t"		// 2
      "dec	%0		\n\t"		// 3
      "		rjmp .+0	\n\t"		// 5
      "		brcs .+2	\n\t"		// 6l / 7h
      "		out %2,%4	\n\t"		// 7l / -
      "		rjmp .+0	\n\t"		// 9
      "		nop		\n\t"		// 10
      "		out %2,%4	\n\t"		// 11
      "		breq end%=	\n\t"		// 12      nt. 13 taken
      "		rjmp .+0	\n\t"		// 14
      "		rjmp .+0	\n\t"		// 16
      "		rjmp .+0	\n\t"		// 18
      "		rjmp loop%=	\n\t"		// 20
      "end%=:			\n\t"
      :	"=&d" (ctr)
      :	"r" (curbyte), "I" (_SFR_IO_ADDR(DATA_PORT)), "r" (maskhi), "r" (masklo)
    );
  }

}


//##############################################################################
//                                                                             #
// End of program                                                              #
//                                                                             #
//##############################################################################

