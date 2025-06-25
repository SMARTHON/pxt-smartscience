SmartScience.InitializeSDcard(SerialPin.P16, SerialPin.P8)
SmartScience.SetHeader(
"Time",
"Temp",
"Light",
"heading",
"Sound"
)
basic.forever(function () {
    SmartScience.SetRow(
    input.runningTime(),
    input.temperature(),
    input.lightLevel(),
    input.acceleration(Dimension.Z),
    input.soundLevel()
    )
    basic.pause(500)
})
