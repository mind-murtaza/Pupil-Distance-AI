import {
  AUDIO_ON_OFF,
  LOWER_PERCENTAGE_FOR_EYE,
  HIGHER_PERCENTAGE_FOR_EYE,
  AUDIO_BE_STILL_PATH,
  AUDIO_COME_CLOSER_PATH,
  AUDIO_ENSURE_PROPER_LIGHTING_PATH,
  AUDIO_LOOK_STRAIGHT_PATH,
  AUDIO_NO_FACE_DETECTED_PATH,
  IRIS_DIAMETER
} from '/Pupil-Distance-AI/env.js'
// } from '/env.js'
/* eslint-disable no-undef */
const video = document.querySelector('#video')
const clickButton = document.querySelector('#click-photo')
const canvas = document.querySelector('#canvas')
const resetPhoto = document.querySelector('#reset-photo')
const resetAndCalculateButtonsDiv = document.querySelector('#reset-and-calculate-buttons')
const calculateDistance = document.querySelector('#calculate')
const videoImageDiv = document.querySelector('#video-and-image')
let ctx = ''
const loader = document.querySelector('.loader')
const calculate = document.querySelector('#calculate')
const pupilDistanceText = document.querySelector('.pupil-distance-text')
const ctxImage = document.getElementById('canvasForImage').getContext('2d')
const mainDivForVideo = document.querySelector('#main-div-for-video')
const mainDivForImage = document.querySelector('#main-div-for-Image')
const cameraOnButton = document.querySelector('#camera-on-button')
const chooseImageButton = document.querySelector('#choose-image-button')
const imageForEyePupils = document.querySelector('#image-for-eye-pupils')
const loaderImage = document.querySelector('.loader-image')

const canvasForImage = document.querySelector('#canvasForImage')
const calculateImagePd = document.querySelector('#calculate-image-pd')
const lightningAndFaceDiv = document.querySelector('#main-div-for-video .face-and-lightning')
const lightning = document.querySelector('#main-div-for-video .face-and-lightning .lightning')
const faceDiv = document.querySelector('#main-div-for-video .face-and-lightning .face')
const faceCloserDiv = document.querySelector('#main-div-for-video .face-and-lightning .face-size')
const faceLookStraight = document.querySelector('#main-div-for-video .face-and-lightning .face-straight')

const ovalFaceImage = document.querySelector('#oval-face-image')

const counterDiv = document.querySelector('.counter')

const audioBeStill = new Audio(AUDIO_BE_STILL_PATH)
const audioComeCloser = new Audio(AUDIO_COME_CLOSER_PATH)
const audioEnsureProperLighting = new Audio(AUDIO_ENSURE_PROPER_LIGHTING_PATH)
const audioLookStraight = new Audio(AUDIO_LOOK_STRAIGHT_PATH)
const audioNoFaceDetected = new Audio(AUDIO_NO_FACE_DETECTED_PATH)

let imageFlag

cameraOnButton.addEventListener('click', () => {
  imageFlag = false
  resetPhotoFunction()
  mainDivForImage.style.display = 'none'
  mainDivForVideo.style.display = ''
  loader.style.display = 'flex'
  calculate.style.display = 'none'
})

chooseImageButton.addEventListener('click', () => {
  imageFlag = true
  ctxImage.clearRect(0, 0, canvasForImage.width, canvasForImage.height)
  imageForEyePupils.value = ''
  mainDivForVideo.style.display = 'none'
  mainDivForImage.style.display = ''
  calculateImagePd.style.display = 'none'
  pupilDistanceText.innerHTML = ''
  videoImageDiv.style.display = 'none'
  stopVideo()
})

imageForEyePupils.addEventListener('change', (e) => {
  pupilDistanceText.innerHTML = ''
  const image = e.target.files[0]
  ctxImage.clearRect(0, 0, canvasForImage.width, canvasForImage.height)
  const img = new Image()
  img.src = URL.createObjectURL(image)
  img.onload = function () {
    let imgWidth = this.width
    let imgHeight = this.height
    while (imgWidth > canvasForImage.width && imgHeight > canvasForImage.height) {
      imgWidth = imgWidth / 2
      imgHeight = imgHeight / 2
    }
    ctxImage.drawImage(img, 0, 0, imgWidth, imgHeight)
  }
  calculateImagePd.style.display = ''
})

let imageData
let imageDataForLight
let diagonalSize
let model
let anotherModel
const eyePDCountStorage = new Map()

const loopForVideoFunction = async () => {
  eyePDCountStorage.clear()
  clickButton.style.display = 'none'
  model = await loadFaceLandmarkDetectionModel()
  anotherModel = await loadFaceLandmarkDetectionModel()
  loader.style.display = 'none'
  let mapCount = 0
  /**
   * If the audio is on and all the audio files are paused, then return true, otherwise return false
   * @returns A boolean value.
   * Generated on 08/19/2022
   */
  function checkAudioIsPlaying () {
    if (AUDIO_ON_OFF && audioBeStill.paused &&
      (audioBeStill.currentTime === 0 || audioBeStill.duration === audioBeStill.currentTime) &&
        audioComeCloser.paused &&
        (audioComeCloser.currentTime === 0 ||
          audioComeCloser.currentTime === audioComeCloser.duration) &&
        audioEnsureProperLighting.paused &&
        (audioEnsureProperLighting.currentTime === 0 ||
          audioEnsureProperLighting.currentTime === audioEnsureProperLighting.duration) &&
        audioLookStraight.paused &&
        (audioLookStraight.currentTime === 0 ||
          audioLookStraight.currentTime === audioLookStraight.duration) &&
        audioNoFaceDetected.paused && (audioNoFaceDetected.currentTime === 0 ||
          audioNoFaceDetected.currentTime === audioNoFaceDetected.duration)) {
      return true
    } else {
      return false
    }
  }

  /**
   * It calculates the distance between the eyes and compares it to the distance between the eyes and the
   * midpoint of the face. If the distance between the eyes is within a certain percentage of the
   * distance between the eyes and the midpoint of the face, then the eyes are straight
   * @param faces () - an array of objects that contain the face data
   *
   * Generated on 08/29/2022
   */
  function calculateEyeDistance (faces) {
    let eyeStraightFlag = false
    const leftEyeIris = {
      left: faces[471],
      bottom: faces[472],
      center: faces[468],
      right: faces[469],
      top: faces[470]
    }
    const rightEyeIris = {
      left: faces[476],
      bottom: faces[477],
      center: faces[473],
      right: faces[474],
      top: faces[475]
    }

    const midX = (faces[193][0] + faces[417][0]) / 2
    const midY = (faces[473][1] + faces[468][1]) / 2

    const leftEyeMidPoints = new Point(leftEyeIris.center[0], leftEyeIris.center[1])
    const rightEyeMidPoints = new Point(rightEyeIris.center[0], rightEyeIris.center[1])
    const midPoints = new Point(midX, midY)
    const rightToMidDistance = rightEyeMidPoints.distanceTo(midPoints)
    const leftToMidDistance = leftEyeMidPoints.distanceTo(midPoints)
    const irisWidth = getIrisWidth(faces)
    const leftEyePD = (IRIS_DIAMETER / irisWidth) * leftToMidDistance
    const LeftEyePD = roundToNearest50(leftEyePD * 100) / 100
    const rightEyePD = (IRIS_DIAMETER / irisWidth) * rightToMidDistance
    const RightEyePD = roundToNearest50(rightEyePD * 100) / 100

    if (leftToMidDistance > rightToMidDistance * LOWER_PERCENTAGE_FOR_EYE &&
      leftToMidDistance < rightToMidDistance * HIGHER_PERCENTAGE_FOR_EYE) {
      mapCount++
      const fullPD = LeftEyePD + RightEyePD
      if (eyePDCountStorage.has(fullPD)) {
        const eyePDObject = {
          count: eyePDCountStorage.get(fullPD).count + 1,
          leftPD: LeftEyePD,
          rightPD: RightEyePD
        }
        eyePDCountStorage.set(fullPD, eyePDObject)
      } else {
        const eyePDObject = {
          count: 1,
          leftPD: LeftEyePD,
          rightPD: RightEyePD
        }
        eyePDCountStorage.set(fullPD, eyePDObject)
      }
      eyeStraightFlag = true
      faceLookStraight.style.color = 'green'
      faceLookStraight.children[1].innerHTML = '✓'
    } else {
      if (checkAudioIsPlaying()) {
        audioLookStraight.play()
      }
      faceLookStraight.style.color = 'red'
      faceLookStraight.children[1].innerHTML = '✕'
    }
    return eyeStraightFlag
  }

  (async function loop () {
    if (videoImageDiv.style.display !== 'none') {
      lightningAndFaceDiv.style.display = 'flex'
      const percentageForFaceInVideo = 1
      const result = isItDark()
      const faces = await model.estimateFaces({
        input: imageData
      })

      const facesForEye = await anotherModel.estimateFaces({
        input: imageDataForLight
      })
      let insideFaceFlag = false
      let eyeStraightFlag = false

      if (faces.length) {
        faceDiv.style.color = 'green'
        faceDiv.children[1].innerHTML = '✓'

        const faceLeftX = faces[0].boundingBox.topLeft[0]
        const faceLeftY = faces[0].boundingBox.topLeft[1]
        const faceLeftPoints = new Point(faceLeftX, faceLeftY)

        const faceRightX = faces[0].boundingBox.bottomRight[0]
        const faceRightY = faces[0].boundingBox.bottomRight[1]
        const faceRightPoints = new Point(faceRightX, faceRightY)
        const diagonalSizeOfFace = faceRightPoints.distanceTo(faceLeftPoints)

        if (diagonalSize * percentageForFaceInVideo < diagonalSizeOfFace) {
          faceCloserDiv.style.color = 'green'
          faceCloserDiv.children[1].innerHTML = '✓'
          insideFaceFlag = true
          if (facesForEye.length && !result) {
            eyeStraightFlag = calculateEyeDistance(facesForEye[0].scaledMesh)
          } else {
            faceLookStraight.style.color = 'red'
            faceLookStraight.children[1].innerHTML = '✕'
          }
        } else {
          if (checkAudioIsPlaying()) {
            audioComeCloser.play()
          }
          faceCloserDiv.style.color = 'red'
          faceCloserDiv.children[1].innerHTML = '✕'

          faceLookStraight.style.color = 'red'
          faceLookStraight.children[1].innerHTML = '✕'
        }
      } else {
        if (checkAudioIsPlaying()) {
          audioNoFaceDetected.play()
        }

        faceDiv.style.color = 'red'
        faceDiv.children[1].innerHTML = '✕'

        faceCloserDiv.style.color = 'red'
        faceCloserDiv.children[1].innerHTML = '✕'

        faceLookStraight.style.color = 'red'
        faceLookStraight.children[1].innerHTML = '✕'
      }

      if (!result) {
        lightning.style.color = 'green'
        lightning.children[1].innerHTML = '✓'
      } else {
        if (checkAudioIsPlaying()) audioEnsureProperLighting.play()
        lightning.style.color = 'red'
        lightning.children[1].innerHTML = '✕'
      }
      if (faces.length && !result && insideFaceFlag && eyeStraightFlag) {
        counterDiv.children[0].children[0].innerHTML = 'loading ' + mapCount + '%'
        if (checkAudioIsPlaying()) {
          audioBeStill.play()
        }
        counterDiv.style.display = 'flex'
      } else {
        counterDiv.style.display = 'none'
      }

      if (mapCount === 99) {
        clickPhoto()
      }
      loop()
    } else {
      clickButton.style.display = 'none'
      lightningAndFaceDiv.style.display = 'none'
      counterDiv.style.display = 'none'
    }
  })()
}

video.addEventListener('playing', function () {
  setTimeout(function () {
    canvas.height = video.videoHeight
    canvas.width = video.videoWidth
  }, 500)
  loopForVideoFunction()
})

/**
 * It takes a video frame, draws it on a canvas, then counts the number of pixels that are dark and the
 * number of pixels that are light. If there are more dark pixels than light pixels, it returns true
 * @returns A boolean value.
 *
 * Generated on 08/19/2022
 */
function isItDark () {
  const fuzzy = 0.1
  const canvas = document.createElement('canvas')
  canvas.height = video.videoHeight
  canvas.width = video.videoWidth

  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0)

  const centerPointX = canvas.width / 2
  const centerPointY = canvas.height / 2

  const PERCENTAGE_OF_OVAL_START_X = 1.53
  const PERCENTAGE_OF_OVAL_START_Y = 1.35
  const PERCENTAGE_OF_OVAL_END_X = 0.57
  const PERCENTAGE_OF_OVAL_END_Y = 0.65
  /*
   * finding the length of the line from the start of the oval to the end of the oval
  **/
  const containerStartXPoint = (centerPointX - (ovalFaceImage.width / 2)) * PERCENTAGE_OF_OVAL_START_X

  const containerStartYPoint = (centerPointY - (ovalFaceImage.height / 2)) * PERCENTAGE_OF_OVAL_START_Y
  const containerStartPoints = new Point(containerStartXPoint, containerStartYPoint)

  const containerEndXPoint = (centerPointX + (ovalFaceImage.width / 2)) * PERCENTAGE_OF_OVAL_END_X
  const containerEndYPoint = (centerPointY + (ovalFaceImage.height / 2)) * PERCENTAGE_OF_OVAL_END_Y
  const containerEndPoints = new Point(containerEndXPoint, containerEndYPoint)

  diagonalSize = containerStartPoints.distanceTo(containerEndPoints)
  imageData = ctx.getImageData(containerStartXPoint, containerStartYPoint,
    ovalFaceImage.width * PERCENTAGE_OF_OVAL_END_X,
    ovalFaceImage.height * PERCENTAGE_OF_OVAL_END_Y)

  imageDataForLight = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const data = imageDataForLight.data
  let r, g, b, maxRGB
  let light = 0
  let dark = 0

  for (let x = 0, len = data.length; x < len; x += 4) {
    r = data[x]
    g = data[x + 1]
    b = data[x + 2]

    maxRGB = Math.max(Math.max(r, g), b)
    if (maxRGB < 128) {
      dark++
    } else {
      light++
    }
  }

  const dlDiff = ((light - dark) / (video.videoWidth * video.videoHeight))

  if (dlDiff + fuzzy < 0) {
    return true /* Dark. */
  } else {
    return false /* Not dark. */
  }
}

let stream
async function startCamera () {
  stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  })
  video.srcObject = stream
}

calculateImagePd.addEventListener('click', () => {
  loaderImage.style.display = 'flex'
  calculateImagePd.style.display = 'none'
  autoDraw(ctxImage, canvasForImage)
})

clickButton.addEventListener('click', function () {
  clickPhoto()
})

/**
 * It takes a photo of the user, hides the video, shows the canvas, and calls the autoDraw function
 */
function clickPhoto () {
  videoImageDiv.style.display = 'none'
  canvas.style.display = 'block'
  resetAndCalculateButtonsDiv.style.display = 'flex'
  clickButton.style.display = 'none'
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

  ctx = canvas.getContext('2d')
  ctx.save()
  ctx.scale(-1, 1)
  ctx.drawImage(video, canvas.width * -1, 0, canvas.width, canvas.height)
  ctx.restore()
  callAutoDraw()
}

/* The above code is adding an event listener to the resetPhoto button. When the button is clicked, the
resetPhotoFunction and loopForVideoFunction are called. */
resetPhoto.addEventListener('click', function () {
  resetPhotoFunction()
  // loopForVideoFunction()
})

/**
 * It resets the page to its original state.
 */
const resetPhotoFunction = async () => {
  await startCamera()
  canvas.style.display = 'none'
  videoImageDiv.style.display = ''
  calculate.style.display = ''
  resetAndCalculateButtonsDiv.style.display = 'none'
  clickButton.style.display = 'block'
  pupilDistanceText.innerHTML = ''
}

calculateDistance.addEventListener('click', function () {
  callAutoDraw()
})

function callAutoDraw () {
  loader.style.display = 'flex'
  calculate.style.display = 'none'
  autoDraw(ctx, canvas)
}

// AUTO CALC PD METHODS START-----------------------------------------------

async function autoDraw (canvas, workingCanvas) {
  if (anotherModel) {
    anotherModel = await loadFaceLandmarkDetectionModel()
  }
  renderPrediction(canvas, workingCanvas)
}

async function loadFaceLandmarkDetectionModel () {
  return faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
      maxFaces: 1,
      staticImageMode: false
    }
  )
}

async function renderPrediction (ctx, workingCanvas) {
  const predictions = await anotherModel.estimateFaces({
    input: ctx.getImageData(0, 0, workingCanvas.width, workingCanvas.height)
  })
  if (predictions.length) {
    displayIrisPosition(predictions, ctx)
  } else {
    pupilDistanceText.innerHTML = '<h2>No Face Detected</h2>'
    loader.style.display = 'none'
    loaderImage.style.display = 'none'
  }
}

/**
 * It takes the predictions from the model and draws a rectangle around the iris of the eye
 * @param predictions () - The predictions returned by the model.
 * @param ctx () - The canvas context
 *
 * Generated on 08/19/2022
 */
function displayIrisPosition (predictions, ctx) {
  ctx.strokeStyle = 'red'
  if (predictions.length > 0) {
    predictions.forEach((prediction) => {
      const keyPoints = prediction.scaledMesh
      if (keyPoints.length === 478) {
        for (let i = 468; i < 478; i++) {
          const x = keyPoints[i][0]
          const y = keyPoints[i][1]
          ctx.beginPath()
          ctx.rect(x, y, 2, 2)
          ctx.stroke()
        }
        const midY = ((keyPoints[473][1] + keyPoints[468][1]) / 2)

        const midX = keyPoints[168][0]

        const leftEyeCenterX = keyPoints[468][0]
        const leftEyeCenterY = keyPoints[468][1]

        const rightEyeCenterX = keyPoints[473][0]
        const rightEyeCenterY = keyPoints[473][1]

        const leftEyePoint = new Point(leftEyeCenterX, leftEyeCenterY)
        const rightEyePoint = new Point(rightEyeCenterX, rightEyeCenterY)

        ctx.lineWidth = 3
        ctx.strokeStyle = 'green'
        ctx.beginPath()
        ctx.moveTo(leftEyeCenterX, leftEyeCenterY)
        ctx.lineTo(midX, midY)
        ctx.stroke()

        ctx.strokeStyle = 'blue'
        ctx.beginPath()
        ctx.moveTo(rightEyeCenterX, rightEyeCenterY)
        ctx.lineTo(midX, midY)
        ctx.stroke()
        let pdText
        if (imageFlag) {
          const midPoint = new Point(midX, midY)
          const leftEyePdInDistance = midPoint.distanceTo(leftEyePoint)
          const rightEyePdInDistance = midPoint.distanceTo(rightEyePoint)

          const irisWidth = getIrisWidth(keyPoints)

          const LeftEyePD = (11.7 / irisWidth) * leftEyePdInDistance
          const RightEyePD = (11.7 / irisWidth) * rightEyePdInDistance
          const leftRoundedPD = roundToNearest50(LeftEyePD * 100) / 100
          const rightRoundedPD = roundToNearest50(RightEyePD * 100) / 100
          pdText = '<h2>Your Pupil Distance is approximately ' +
                    (leftRoundedPD + rightRoundedPD) + 'mm</h2>' +
                    '<h3>Your Left Eye Monocular PD is approximately ' +
                    leftRoundedPD + 'mm</h3>' +
                    '<h3>Your Right Eye Monocular PD is approximately ' +
                    rightRoundedPD + 'mm</h3>'
        } else {
          const maxPdDetail = {
            count: 0,
            pd: 0
          }
          for (const [pd, pdObj] of eyePDCountStorage) {
            if (maxPdDetail.count < pdObj.count) {
              maxPdDetail.count = pdObj.count
              maxPdDetail.pd = pd
            }
          }

          const pdValueObj = eyePDCountStorage.get(maxPdDetail.pd)
          console.log('🎮🌴 ~ predictions.forEach ~ pdValueObj', pdValueObj)
          pdText = '<h2>Your Pupil Distance is approximately ' +
                    (pdValueObj.leftPD + pdValueObj.rightPD) + 'mm</h2>' +
                    '<h3>Your Left Eye Monocular PD is approximately ' +
                    pdValueObj.leftPD + 'mm</h3>' +
                    '<h3>Your Right Eye Monocular PD is approximately ' +
                    pdValueObj.rightPD + 'mm</h3>'
        }
        loader.style.display = 'none'
        loaderImage.style.display = 'none'
        stopVideo()

        pupilDistanceText.innerHTML = pdText
      }
    })
  }
}

/**
 * It takes the keypoints of the left and right eye and returns the average of the two iris diameters
 * @param keyPoints () - The keypoints of the face.
 * @returns The average of the left and right iris diameters.
 *
 * Generated on 08/31/2022
 */
function getIrisWidth (keyPoints) {
  // iris left
  const xLeftIrisLeft = keyPoints[474][0]
  const yLeftIrisLeft = keyPoints[474][1]
  const xLeftIrisRight = keyPoints[476][0]
  const yLeftIrisRight = keyPoints[476][1]

  // iris right
  const xRightIrisLeft = keyPoints[471][0]
  const yRightIrisLeft = keyPoints[471][1]
  const xRightIrisRight = keyPoints[469][0]
  const yRightIrisRight = keyPoints[469][1]

  const leftIrisLeftPoints = new Point(xLeftIrisLeft, yLeftIrisLeft)
  const leftIrisRightPoints = new Point(xLeftIrisRight, yLeftIrisRight)

  const rightIrisLeftPoints = new Point(xRightIrisLeft, yRightIrisLeft)
  const rightIrisRightPoints = new Point(xRightIrisRight, yRightIrisRight)

  const irisDiameterLeft = leftIrisLeftPoints.distanceTo(leftIrisRightPoints)
  const irisDiameterRight = rightIrisLeftPoints.distanceTo(rightIrisRightPoints)

  return (irisDiameterLeft + irisDiameterRight) / 2
}

function stopVideo () {
  if (stream) {
    stream.getTracks().forEach(function (track) {
      if (track.readyState === 'live') {
        track.stop()
      }
    })
  }
  if (video.srcObject) video.srcObject = undefined
}

/**
 * Round the number to the nearest 50.
 * @param num () - The number to round
 *
 * Generated on 08/19/2022
 */
const roundToNearest50 = (num) => Math.round(num / 50) * 50

/* A point is a thing that has an x and a y coordinate, and can calculate its distance to another
point. */
class Point {
  constructor (x, y) {
    this.x = x
    this.y = y
    /* A function that calculates the distance between two points. */
    this.distanceTo = function (point) {
      const distance = Math.sqrt(
        Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2)
      )
      return distance
    }
  }
}
