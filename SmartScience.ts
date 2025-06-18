namespace SmartScience {
    let NTC_table = [
        999, 997, 995, 993, 991,   // -40  -  -36
        989, 986, 984, 981, 978,   // -35  -  -31
        975, 972, 969, 965, 962,   // -30  -  -26
        958, 954, 949, 945, 940,   // -25  -  -21
        935, 930, 925, 919, 914,   // -20  -  -16
        908, 901, 895, 888, 881,   // -15  -  -11
        874, 867, 859, 851, 843,   // -10  -  -6
        834, 826, 817, 808, 799,   //  -5  -  -1
        789, 780, 770, 760, 749,   //   0  -  4
        739, 728, 718, 707, 696,   //   5  -  9
        685, 673, 662, 651, 639,   //  10  -  14
        628, 616, 604, 593, 581,   //  15  -  19
        570, 558, 546, 535, 523,   //  20  -  24
        512, 501, 489, 478, 467,   //  25  -  29
        456, 445, 435, 424, 414,   //  30  -  34
        404, 394, 384, 374, 364,   //  35  -  39
        355, 346, 336, 328, 319,   //  40  -  44
        310, 302, 294, 286, 278,   //  45  -  49
        270, 263, 256, 249, 242,   //  50  -  54
        235, 228, 222, 216, 210,   //  55  -  59
        204, 198, 193, 187, 182,   //  60  -  64
        177, 172, 167, 162, 158,   //  65  -  69
        153, 149, 145, 141, 137,   //  70  -  74
        133, 129, 126, 122, 119,   //  75  -  79
        115, 112, 109, 106, 103,   //  80  -  84
        100
    ]
    // Water
    //---------------------------------------------------------------------
    /**
     * get NTC Temperature
     * @param pin is ADC pin, eg: AnalogPin.P0
     */
    //% blockId="NTCSenor_GET" block="Get water temperature at %pin"
    //% group="Water"
    //% weight=90
    export function ntc_Temperature(pin: AnalogPin): number {
        let value = pins.analogReadPin(pin) * 3.3 / 5
        for (let i = 0; i < NTC_table.length; i++) {
            if (value > NTC_table[i])
                return i - 40;
        }
        return 85;
    }

    /**
    * get water level value (0~100)
    * @param waterlevelpin describe parameter here, eg: AnalogPin.P0
    */
    //% group="Water"
    //% blockId="readWaterLevel" block="value of water level(0~100) at pin %waterlevelpin"
    //% weight=100
    export function ReadWaterLevel(waterlevelpin: AnalogPin): number {
        let voltage = 0;
        let waterlevel = 0;
        voltage = pins.map(
            pins.analogReadPin(waterlevelpin),
            0,
            700,
            0,
            100
        );
        waterlevel = voltage;
        return Math.round(waterlevel)
    }

    //PH Sensor
    //----------------------------------------------------------------------------

    let ph_value = ""
    //% blockId="readPH"
    //% block="Read PH value at %pin"
    //% weight=80 group="PH Sensor"
    export function readPH(pin: AnalogPin): string {
        let sensorarray: number[] = []
        for (let i = 0; i < 10; i++) {
            sensorarray.push(pins.analogReadPin(AnalogPin.P0))
            basic.pause(10)
        }
        sensorarray.sort((n1, n2) => n1 - n2);
        for (let value of sensorarray) {
            serial.writeLine(value.toString())
        }
        ph_value = (sensorarray[5] * 5 * 10 * 35 / 1024).toString()
        serial.writeLine("===========")
        if (ph_value.length == 3) {
            serial.writeLine("PH: " + ph_value.substr(0, 1) + "." + ph_value.substr(1, ph_value.length))
            return ph_value.substr(0, 1) + "." + ph_value.substr(1, ph_value.length)
        } else {
            serial.writeLine("PH: " + ph_value.substr(0, 2) + "." + ph_value.substr(2, ph_value.length))
            return ph_value.substr(0, 2) + "." + ph_value.substr(2, ph_value.length)
        }
    }

    let ph_value_number = 0
    //% blockId="readPHNumber"
    //% block="Read PH value (x100) pin %ports| offset %offset"
    //% weight=70 group="PH Sensor"
    export function readPhNumber(ports: AnalogPin, offset: number): number {

        let temp = 0;
        temp = ports
        let sensorarray: number[] = []
        for (let i = 0; i < 10; i++) {
            sensorarray.push(pins.analogReadPin(temp))
            basic.pause(10)
        }
        sensorarray.sort((n1, n2) => n1 - n2);
        for (let value of sensorarray) {
            serial.writeLine(value.toString())
        }
        ph_value_number = (sensorarray[5] * 5 * 10 * 35 / 1024) + offset
        return ph_value_number
    }

    //Laser Dust Sensor (FS00202) pm2.5
    //-------------------------------------------------------------------------

    export enum PmMenu {
        //% block="PM1.0"
        PM1 = 0,
        //% block="PM2.5"
        PM25 = 1,
        //% block="PM10"
        PM10 = 2
    }

    const PM_ADDR = 0x50; // sensor I2C address

    /**
      * Read PM1.0, PM2.5 & PM10
      */

    //% group="Pm2.5"
    //% blockId="readLaserDustSensor" //% block="Get %pmType (ug/m3) at I2C"
    //% weight=15
    export function PMdata(pmType: PmMenu): number {
        pins.i2cWriteNumber(PM_ADDR, 0x00, NumberFormat.Int8LE);
        let buffer = pins.i2cReadBuffer(PM_ADDR, 32);
        let sum = 0
        for (let i = 0; i < 30; i++) {
            sum += buffer[i]
        }
        let data = [-1, -1, -1]
        if (sum == ((buffer[30] << 8) | buffer[31])) {
            data[0] = Math.round(((buffer[0x04] << 8) | buffer[0x05]) / 2.002)
            data[1] = Math.round(((buffer[0x06] << 8) | buffer[0x07]) / 2.093)
            data[2] = Math.round(((buffer[0x08] << 8) | buffer[0x09]) / 1.841)
        }
        return data[pmType]
    }



    // gas
    //----------------------------------------------------------------------------
    /**
    * get Towngas value
    * @param MQ5pin describe parameter here, eg: AnalogPin.P0
    */
    //% group="Gas"
    //% blockId="readTownGasValue" block="value of MQ5 Town Gas sensor at pin %MQ5pin"
    //% weight=56
    export function ReadTownGasValue(MQ5pin: AnalogPin): number {
        let Val = pins.analogReadPin(MQ5pin)
        let Val_map = pins.map(Val, 80, 1023, 0, 100)
        if (Val_map < 0) { Val_map = 0 }
        return Val_map
    }

    // CO2 and TVOC Sensor (CCS811)
    //----------------------------------------------------------------------------
    let TVOC_OK = true
    /* CO2*/
    function indenvGasStatus(): number {
        //pins.setPull(DigitalPin.P19, PinPullMode.PullUp)
        //pins.setPull(DigitalPin.P20, PinPullMode.PullUp)
        //basic.pause(200)
        pins.i2cWriteNumber(90, 0, NumberFormat.UInt8LE, true)
        //basic.pause(200)
        let GasStatus = pins.i2cReadNumber(90, NumberFormat.UInt8LE, false)
        //basic.pause(200)
        return GasStatus
    }

    function indenvGasReady(): boolean {
        if (TVOC_OK != true) {
            return false
        }
        //pins.setPull(DigitalPin.P19, PinPullMode.PullUp)
        //pins.setPull(DigitalPin.P20, PinPullMode.PullUp)
        //basic.pause(200)
        pins.i2cWriteNumber(90, 0, NumberFormat.UInt8LE, true)
        //basic.pause(200)
        if ((pins.i2cReadNumber(90, NumberFormat.UInt8LE, false) % 16) != 8) {
            return false
        }
        return true
    }
    /**
    * CO2 and TVOC Sensor (CCS811) Start
    */
    //% blockId="indenvStart" block="CCS811 Start"
    //% group="CO2 and TVOC Sensor (CCS811)"
    //% weight=40
    export function indenvStart(): void {
        TVOC_OK = true
        //pins.setPull(DigitalPin.P19, PinPullMode.PullUp)
        //pins.setPull(DigitalPin.P20, PinPullMode.PullUp)
        //basic.pause(200)
        //basic.pause(200)
        /* CJMCU-8118 CCS811 addr 0x5A reg 0x20 Read Device ID = 0x81 */
        pins.i2cWriteNumber(90, 32, NumberFormat.UInt8LE, true)
        //basic.pause(200)
        if (pins.i2cReadNumber(90, NumberFormat.UInt8LE, false) != 129) {
            TVOC_OK = false
        }
        basic.pause(200)
        /* CJMCU-8118 AppStart CCS811 addr 0x5A register 0xF4 */
        pins.i2cWriteNumber(90, 244, NumberFormat.UInt8LE, false)
        //basic.pause(200)
        /* CJMCU-8118 CCS811 Driving Mode 1 addr 0x5A register 0x01 0x0110 */
        pins.i2cWriteNumber(90, 272, NumberFormat.UInt16BE, false)
        basic.pause(200)
        /* CJMCU-8118 CCS811 Status addr 0x5A register 0x00 return 1 byte */
        pins.i2cWriteNumber(90, 0, NumberFormat.UInt8LE, true)
        //basic.pause(200)
        if (pins.i2cReadNumber(90, NumberFormat.UInt8LE, false) % 2 != 0) {
            TVOC_OK = false
        }
        basic.pause(200)
        pins.i2cWriteNumber(90, 0, NumberFormat.UInt8LE, true)
        //basic.pause(200)
        if (Math.idiv(pins.i2cReadNumber(90, NumberFormat.UInt8LE, false), 16) != 9) {
            TVOC_OK = false
        }
        basic.pause(200)
    }
    /**
     * Set TVOC and CO2 baseline (Baseline should be a decimal value)
     * @param value  , eg: 33915
     */
    //% group="CO2 and TVOC Sensor (CCS811)"
    //% blockId=CCS811_setBaseline block="set CO2 and TVOC baseline|%value value"
    //% weight=39
    export function setBaseline(value: number): void {
        let buffer: Buffer = pins.createBuffer(3);
        buffer[0] = 0x20;
        buffer[1] = value >> 8 & 0xff;
        buffer[2] = value & 0xff;
        pins.i2cWriteBuffer(90, buffer);

    }
    /**
    * Read estimated CO2
    */
    //% group="CO2 and TVOC Sensor (CCS811)"
    //% blockId="indenvgeteCO2" block="Value of CO2"
    //% weight=38
    export function indenvgeteCO2(): number {

        let i

        i = 0

        while (indenvGasReady() != true) {
            basic.pause(200)
            i = i + 1
            if (i >= 10)
                return -1;
        }
        //pins.setPull(DigitalPin.P19, PinPullMode.PullUp)
        //pins.setPull(DigitalPin.P20, PinPullMode.PullUp)
        //basic.pause(200)
        pins.i2cWriteNumber(90, 2, NumberFormat.UInt8LE, true)
        //basic.pause(200)
        return pins.i2cReadNumber(90, NumberFormat.UInt16BE, false)
    }
    /**
    * Read Total VOC
    */
    //% group="CO2 and TVOC Sensor (CCS811)"
    //% blockId="indenvgetTVOC" block="Value of TVOC"
    //% weight=37
    export function indenvgetTVOC(): number {

        let i

        i = 0

        while (indenvGasReady() != true) {
            basic.pause(200)
            i = i + 1
            if (i >= 10)
                return -1;
        }
        //pins.setPull(DigitalPin.P19, PinPullMode.PullUp)
        //pins.setPull(DigitalPin.P20, PinPullMode.PullUp)
        //basic.pause(200)
        pins.i2cWriteNumber(90, 2, NumberFormat.UInt8LE, true)
        //basic.pause(200)
        return (pins.i2cReadNumber(90, NumberFormat.UInt32BE, false) % 65536)
    }

    //SD Card
    //-----------------------------------------

    /**
     * Init the iotbit
     * @param txpin describe parameter here, eg: SerialPin.P8
     * @param rxpin describe parameter here, eg: SerialPin.P16
     */
    //%blockId= InitializeSDcard
    //%block="Initialize SD Card TX %tx_pin RX %rx_pin"
    //%subcategory=SD Card
    //% weight=140

    export function InitializeSDcard(txpin: SerialPin, rxpin: SerialPin): void {
        serial.redirect(txpin, rxpin, BaudRate.BaudRate9600);
        serial.setTxBufferSize(128)
        serial.setRxBufferSize(128)
    }

    //%blockId= SetHeader
    //%block="Create CSV File Header* |field1 string%field1||field2 string%field2|field3 string%field3|field4 string%field4|field5 string%field5"
    //%subcategory=SD Card
    //% weight=139
    export function SetHeader(field1: string = null, field2: string = null, field3: string = null, field4: string = null, field5: string = null): void {
        if (field1 != null && field2 != null && field3 != null && field4 != null && field5 != null) {
            let header = field1 + ',' + field2 + ',' + field3 + ',' + field4 + ',' + field5
            serial.writeLine(header)
        }
        else if (field1 != null && field2 != null && field3 != null && field4 != null && field5 == null) {
            let header = field1 + ',' + field2 + ',' + field3 + ',' + field4
            serial.writeLine(header)
        }
        else if (field1 != null && field2 != null && field3 != null && field4 == null && field5 == null) {
            let header = field1 + ',' + field2 + ',' + field3
            serial.writeLine(header)
        }
        else if (field1 != null && field2 != null && field3 == null && field4 == null && field5 == null) {
            let header = field1 + ',' + field2
            serial.writeLine(header)
        }
        else if (field1 != null && field2 == null && field3 == null && field4 == null && field5 == null) {
            let header = field1
            serial.writeLine(header)
        }
        else if (field1 == null && field2 == null && field3 == null && field4 == null && field5 == null) {
            let header = null
            serial.writeLine(header)
        }

    }

    //%blockId= SetRow
    //%block="Log the data to CSV File* |field1 value%field1||field2 value%field2|field3 value%field3|field4 value%field4|field5 value%field5"
    //%subcategory=SD Card
    //% weight=138
    export function SetRow(field1: number = null, field2: number = null, field3: number = null, field4: number = null, field5: number = null): void {
        if (field1 != null && field2 != null && field3 != null && field4 != null && field5 != null) {
            let row = field1 + ',' + field2 + ',' + field3 + ',' + field4 + ',' + field5
            serial.writeLine(row)
        }
        else if (field1 != null && field2 != null && field3 != null && field4 != null && field5 == null) {
            let row = field1 + ',' + field2 + ',' + field3 + ',' + field4
            serial.writeLine(row)
        }
        else if (field1 != null && field2 != null && field3 != null && field4 == null && field5 == null) {
            let row = field1 + ',' + field2 + ',' + field3
            serial.writeLine(row)
        }
        else if (field1 != null && field2 != null && field3 == null && field4 == null && field5 == null) {
            let row = field1 + ',' + field2
            serial.writeLine(row)
        }
        else if (field1 != null && field2 == null && field3 == null && field4 == null && field5 == null) {
            let row = field1.toString()
            serial.writeLine(row)
        }
        else if (field1 == null && field2 == null && field3 == null && field4 == null && field5 == null) {
            let row = null
            serial.writeLine(row)
        }

    }

    //--------BME280--------------------------------------------------

    // BME280 Addresses
    let BME280_I2C_ADDR = 0x76
    let dig_T1 = getUInt16LE(0x88)
    let dig_T2 = getInt16LE(0x8A)
    let dig_T3 = getInt16LE(0x8C)
    let dig_P1 = getUInt16LE(0x8E)
    let dig_P2 = getInt16LE(0x90)
    let dig_P3 = getInt16LE(0x92)
    let dig_P4 = getInt16LE(0x94)
    let dig_P5 = getInt16LE(0x96)
    let dig_P6 = getInt16LE(0x98)
    let dig_P7 = getInt16LE(0x9A)
    let dig_P8 = getInt16LE(0x9C)
    let dig_P9 = getInt16LE(0x9E)
    let dig_H1 = getreg(0xA1)
    let dig_H2 = getInt16LE(0xE1)
    let dig_H3 = getreg(0xE3)
    let a = getreg(0xE5)
    let dig_H4 = (getreg(0xE4) << 4) + (a % 16)
    let dig_H5 = (getreg(0xE6) << 4) + (a >> 4)
    let dig_H6 = getInt8LE(0xE7)
    let T = 0
    let P = 0
    let H = 0
    setreg(0xF2, 0x04)
    setreg(0xF4, 0x2F)
    setreg(0xF5, 0x0C)
    setreg(0xF4, 0x2F)

    // Stores compensation values for Temperature (must be read from BME280 NVM)
    let digT1Val = 0
    let digT2Val = 0
    let digT3Val = 0

    // Stores compensation values for humidity (must be read from BME280 NVM)
    let digH1Val = 0
    let digH2Val = 0
    let digH3Val = 0
    let digH4Val = 0
    let digH5Val = 0
    let digH6Val = 0

    // Buffer to hold pressure compensation values to pass to the C++ compensation function
    let digPBuf: Buffer

    // BME Compensation Parameter Addresses for Temperature
    const digT1 = 0x88
    const digT2 = 0x8A
    const digT3 = 0x8C

    // BME Compensation Parameter Addresses for Pressure
    const digP1 = 0x8E
    const digP2 = 0x90
    const digP3 = 0x92
    const digP4 = 0x94
    const digP5 = 0x96
    const digP6 = 0x98
    const digP7 = 0x9A
    const digP8 = 0x9C
    const digP9 = 0x9E

    // BME Compensation Parameter Addresses for Humidity
    const digH1 = 0xA1
    const digH2 = 0xE1
    const digH3 = 0xE3
    const e5Reg = 0xE5
    const e4Reg = 0xE4
    const e6Reg = 0xE6
    const digH6 = 0xE7

    let Reference_VOLTAGE = 3100



    export enum BME280_state {
        //% block="temperature(℃)" enumval=0
        BME280_temperature_C,

        //% block="humidity(0~100)" enumval=1
        BME280_humidity,

        //% block="pressure(hPa)" enumval=2
        BME280_pressure,

        //% block="altitude(M)" enumval=3
        BME280_altitude,
    }



    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(BME280_I2C_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int16LE);
    }
    function get(): void {
        let adc_T = (getreg(0xFA) << 12) + (getreg(0xFB) << 4) + (getreg(0xFC) >> 4)
        let var1 = (((adc_T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
        let var2 = (((((adc_T >> 4) - dig_T1) * ((adc_T >> 4) - dig_T1)) >> 12) * dig_T3) >> 14
        let t = var1 + var2
        T = ((t * 5 + 128) >> 8) / 100
        var1 = (t >> 1) - 64000
        var2 = (((var1 >> 2) * (var1 >> 2)) >> 11) * dig_P6
        var2 = var2 + ((var1 * dig_P5) << 1)
        var2 = (var2 >> 2) + (dig_P4 << 16)
        var1 = (((dig_P3 * ((var1 >> 2) * (var1 >> 2)) >> 13) >> 3) + (((dig_P2) * var1) >> 1)) >> 18
        var1 = ((32768 + var1) * dig_P1) >> 15
        if (var1 == 0)
            return; // avoid exception caused by division by zero
        let adc_P = (getreg(0xF7) << 12) + (getreg(0xF8) << 4) + (getreg(0xF9) >> 4)
        let _p = ((1048576 - adc_P) - (var2 >> 12)) * 3125
        _p = (_p / var1) * 2;
        var1 = (dig_P9 * (((_p >> 3) * (_p >> 3)) >> 13)) >> 12
        var2 = (((_p >> 2)) * dig_P8) >> 13
        P = _p + ((var1 + var2 + dig_P7) >> 4)
        let adc_H = (getreg(0xFD) << 8) + getreg(0xFE)
        var1 = t - 76800
        var2 = (((adc_H << 14) - (dig_H4 << 20) - (dig_H5 * var1)) + 16384) >> 15
        var1 = var2 * (((((((var1 * dig_H6) >> 10) * (((var1 * dig_H3) >> 11) + 32768)) >> 10) + 2097152) * dig_H2 + 8192) >> 14)
        var2 = var1 - (((((var1 >> 15) * (var1 >> 15)) >> 7) * dig_H1) >> 4)
        if (var2 < 0) var2 = 0
        if (var2 > 419430400) var2 = 419430400
        H = (var2 >> 12) / 1024
    }

    //% group="Temperature, Humidity and Pressure Sensor (BME280)"
    //% blockId="BME280value" block="value of BME280 %state"
    //% weight=20
    export function octopus_BME280(state: BME280_state): number {
        switch (state) {
            case 0:
                get();
                return Math.round(T);
                break;
            case 1:
                get();
                return Math.round(H);
                break;
            case 2:
                get();
                return Math.round(P / 100);
                break;
            case 3:
                get();
                return Math.round(1015 - (P / 100)) * 9
                break;
            default:
                return 0
        }
        return 0;
    }

    //------------------BME280----------------------------------------------
}