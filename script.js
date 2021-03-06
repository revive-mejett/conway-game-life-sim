'use strict'



document.addEventListener('DOMContentLoaded', setup)


//the array which will hold info on the conways game of life
//first index represents the row (clicked Y) second index represents the column (clicked X)
let conwayDataArray

//saved data variables
let savedData //Map where the key is the name of the saved grid.
const maxSavedGrids = 20 // # of saved cannot exceed this.



//grid variables
let canvasWidth = 700
let gridDimensions = 20
let tileWidth = canvasWidth/gridDimensions

//variable id to hold the time interval, and the speed multiplier of simulation
let conwayTimeInterval
let speedMultiplier = 1
let isRunning = false


function setup() {
    savedData = new Map()

    if (localStorage.getItem('savedGrids') != undefined) {
        loadFromLocalStorage()
    }
    const canvas = document.createElement('canvas')
    const gridSizeSlider = document.querySelector('#grid-size-slider')
    const dimensionSlider = document.querySelector('#grid-dimension-slider')
    const speedSlider = document.querySelector('#speed-slider')

    canvas.setAttribute('class', 'conway-grid')
    canvas.setAttribute('height', `${canvasWidth}px`)
    canvas.setAttribute('width', `${canvasWidth}px`)

    let ctx = canvas.getContext('2d')
    document.querySelector('#conway-grid-section').appendChild(canvas)

    //set up the grid
    setupGrid()

    //event listeners
    document.querySelector('#start').addEventListener('click', beginTime)
    document.querySelector('#start').addEventListener('click', () => setEnabledSettings(false))
    document.querySelector('#stop').addEventListener('click', stopTime)
    document.querySelector('#stop').addEventListener('click', () => setEnabledSettings(false))
    document.querySelector('#reset').addEventListener('click', reset)
    document.querySelector('#reset').addEventListener('click', () => setEnabledSettings(true))
    gridSizeSlider.addEventListener('change', () => document.querySelector('#grid-size-setting').textContent = `Set grid size : ${gridSizeSlider.value} x ${gridSizeSlider.value} pixels`)
    dimensionSlider.addEventListener('change', () => document.querySelector('#dimension-setting').textContent = `Set dimensions: ${dimensionSlider.value} x ${dimensionSlider.value}`)
    speedSlider.addEventListener('change', () => document.querySelector('#speed-setting').textContent = `Set simulation speed: ${speedSlider.value}x`)

    //setting button event listeners
    document.querySelector('#dimension-setting').addEventListener('click', () => {
        gridDimensions = dimensionSlider.value
        
        setupGrid()
        initializeConwayData()
        drawPopulationGrid()
    })

    document.querySelector('#grid-size-setting').addEventListener('click', () => {
        canvasWidth = gridSizeSlider.value
        setupGrid()
        initializeConwayData()
        drawPopulationGrid()
    })

    document.querySelector('#speed-setting').addEventListener('click', () => {
        speedMultiplier = speedSlider.value
        document.querySelector('#info-paragraph').textContent = `Current speed: ${speedMultiplier}x`
    })
    
    //save setting event listeners
    document.querySelector('#save-grid').addEventListener('click', addToSaved)

    //IF YOU WANT TO IMPLEMENT GRID, UNCOMMENT
    // document.querySelector('#load-grid').addEventListener('click', () => {
    //     let gridName = document.querySelector('#grid-name-input').value
    //     const savedGrid = savedData.get(gridName)
    //     loadGrid(savedGrid)
    // })


    document.querySelector('#info-paragraph').textContent = `Current speed: ${speedMultiplier}x`

    canvas.addEventListener('click', flipTile)
    
    initializeConwayData()
    drawPopulationGrid()
    
}

/**
 * Sets up the grid, setting the grid's width/height atribute, clearing old grid and changing tileWidth as it depends on dimensions and width of canvas
 */
function setupGrid() {
    
    const canvas = document.querySelector('.conway-grid')
    let ctx = canvas.getContext('2d')

    canvas.setAttribute('height', `${canvasWidth}px`)
    canvas.setAttribute('width', `${canvasWidth}px`)

    ctx.clearRect(0,0,canvasWidth,canvasWidth)

    tileWidth = canvasWidth/gridDimensions
}

/**Enable/disable all setting buttons.
 * 
 * @param {boolean} setEnabled -- true to enable all setting buttons, false to disable them
 */
function setEnabledSettings(setEnabled) {
    const settingButtons = document.querySelectorAll('.setting-button')
    const loadButtons = document.querySelectorAll('.load-item')
    const sliders = document.querySelectorAll('.input-slider')
    settingButtons.forEach(button => button.disabled = setEnabled ? false : true)
    loadButtons.forEach(button => button.disabled = setEnabled ? false : true)
    sliders.forEach(button => button.disabled = setEnabled ? false : true)
}

/**
 * start the generation timeflow
 */
function beginTime() {
    isRunning = true
    if (!conwayTimeInterval) {
        conwayTimeInterval = setInterval(() => {
            determineNextGeneration()
        }, 200 * (1/speedMultiplier));
    }
}

/**
 * stops the generation timeflow
 */
function stopTime() {
    isRunning = false
    if (conwayTimeInterval) {
        conwayTimeInterval = clearInterval(conwayTimeInterval)
    }
}

/**
 * resets the map, and stops the time if running
 */
function reset() {
    isRunning = false
    if (conwayTimeInterval) {
        conwayTimeInterval = clearInterval(conwayTimeInterval)
    }
    initializeConwayData()
    drawPopulationGrid()
}

/**
 * Determines the next generation of tiles/cells
 */
function determineNextGeneration() {
    let xPos = 0
    let yPos = 0
    let nextGeneration = [] //the array that holds the next generation
    conwayDataArray.forEach((dataRow, rowIndex) => {
        let newRowArray = []
        dataRow.forEach((tile, colIndex) => {
            let tileState = false
            //do not run script on the edges
            if (rowIndex != 0 && colIndex != 0 && rowIndex != conwayDataArray.length -1 && colIndex != conwayDataArray[rowIndex].length -1) {
                tileState = determineLiveCell(colIndex, rowIndex)
            }
            xPos += tileWidth
            newRowArray.push(tileState)
        })
        //move row down, reset x to 0 to begin the next row
        yPos += tileWidth
        xPos = 0
        nextGeneration.push(newRowArray)
    })
    conwayDataArray = nextGeneration
    drawPopulationGrid()
}

/**
 * renders the population grid, updates it
 */
function drawPopulationGrid() {
    let xPos = 0
    let yPos = 0
    conwayDataArray.forEach((dataRow, rowIndex) => {
        dataRow.forEach((tile, colIndex) => {
            fillCell(xPos, yPos, rowIndex, colIndex)
            xPos += tileWidth
        })
        //move row down, reset x to 0 to begin the next row
        yPos += tileWidth
        xPos = 0
    })
}


/**
 * fills the cell based on the living state of the cell.
 * 
 * @param {number} xPos --the x position in pixels relative to the start left edge of canvas
 * @param {number} yPos --the y position in pixels relative to the start top edge of canvas
 * @param {number} rowIndex --the data array's row index 
 * @param {number} colIndex --the data array's column index 
 */
function fillCell(xPos, yPos, rowIndex, colIndex) {
    const canvas = document.querySelector('.conway-grid')
    let ctx = canvas.getContext('2d')
    ctx.beginPath()
    
    ctx.fillStyle = conwayDataArray[rowIndex][colIndex] ? 'rgb(200,200,200)' : 'rgb(0,0,0)'
    
    ctx.strokeStyle = 'rgb(35,35,35)'
    ctx.rect(xPos, yPos, tileWidth, tileWidth)
    ctx.fill()
    ctx.stroke()
}

/**
 * flips the tile's live/dead state when a tile is clicked. Will not flip if the simulator is running
 * @param {*} e -- mouse click event
 */

function flipTile(e) {

    if (isRunning) {
        return
    }
    const canvas = document.querySelector('.conway-grid')
    let ctx = canvas.getContext('2d')

    //get the tile position from the clicking position, converting to a corresponding array index
    const clickedColumn = Math.floor(e.offsetX/tileWidth)
    const clickedRow = Math.floor(e.offsetY/tileWidth)

    //flips the value of the tile

    conwayDataArray[clickedRow][clickedColumn] = !conwayDataArray[clickedRow][clickedColumn]
    drawPopulationGrid()
    
}

/**Determines if the cell lives or not based on the neighboring cells and the cell's current state
 * 
 * @param {int} tileXPos -- the x position of the tile (this is the column index)
 * @param {int} tileYPos -- the y position of the tile (this is the row index)
 * @returns 
 */
function determineLiveCell(tileXPos, tileYPos) {

    // automatically set them dead at the edges/corners of map
    if (tileXPos == 0 || tileXPos == conwayDataArray[0].length-1) {
        return false;
    }
    if (tileYPos == 0 || tileXPos == conwayDataArray.length-1) {
        return false;
    }
    // y is row, x is column
    let numberLiveNeighbours = countAliveNeighbours(tileXPos, tileYPos)
    let isAlive = conwayDataArray[tileYPos][tileXPos]


    //any cell with fewer than 2 or more than 3 live neighbours dies
    if (isAlive && (numberLiveNeighbours < 2 || numberLiveNeighbours > 3)) {
        return false
    }
    // any cell with two or three neighbours lives on
    else if ( isAlive && (numberLiveNeighbours == 2 || numberLiveNeighbours == 3)) {
        return true
    }
    //any dead cell with exactly 3 live neighbours lives
    else if (!isAlive && numberLiveNeighbours == 3) {
        return true
    }
    //any dead cell with other than 3 neighbors remains dead
    else {
        return false
    }
}

/**Counts the number of live cells/tiles in the
 * 
 * @param {int} tileXPos -- the x position of the tile
 * @param {int} tileYPos -- the Y position of the tile
 * @returns 
 */
function countAliveNeighbours(tileXPos, tileYPos) {
    let numberLiveNeighbours = 0
    for (let i = tileYPos - 1; i <= tileYPos+1; i++) {

        for (let j = tileXPos - 1; j <= tileXPos+1; j++) {
            if ((i != tileYPos || j != tileXPos)) {
                if (conwayDataArray[i][j]) {
                    numberLiveNeighbours++
                }
            }
        }
    }
    return numberLiveNeighbours;
}



/**
 * initialize the array to contain the initial data of conways game of life
 */
function initializeConwayData() {
    conwayDataArray = []
    for (let i = 0; i < gridDimensions; i++) {
        let newRowArray = []
        for (let j = 0; j < gridDimensions; j++) {
            newRowArray.push(false)
        }
        conwayDataArray.push(newRowArray)
    }
}

/**Copies an array of conway data to prevent aliasing
 * 
 * @param {Array} originalArr 
 * @returns {Array} -- a duplicate copy of the original array
 */
function copyArray(originalArr) {
    let newArray = []
    originalArr.forEach(row => {
        let newRowArray = []
        row.forEach(cell => {
            newRowArray.push(cell)
        })
        newArray.push(newRowArray)
    })
    return newArray
}

/**Adds a new JSON object containing current grid variables to the savedData Map after data validation
 * Input name cannot contain only spaces or be empty. Max grids saved cannot exceed maxSavedGrids (see global vars)
 * @returns 
 */
function addToSaved() {

    if (savedData.size >= maxSavedGrids) {
        alert('Maximum saved grids exceeded.')
        return
    }
    const allSavedItems = Array.from(document.querySelectorAll('.save-item'))

    let gridName = document.querySelector('#grid-name-input').value

    const alreadyExists = allSavedItems.find(item => item.id === gridName)

    //if empty name or spaces provided, tell user to name it.
    if (gridName == undefined || gridName.trim() === '') {
        alert('Add a name to save!')
        return
    }

    //do not save it an existing name already exists
    if (alreadyExists) {
 
        alert('Name already exists!')
        return
    }



    

    const newGrid = {
        name : gridName,
        arrayData : copyArray(conwayDataArray),
        width : canvasWidth,
        dimension : gridDimensions
    }

    savedData.set(gridName, newGrid)

    addSaveItemToDOM(newGrid)
    updateLocalStorage()
}

/**Sets the global grid variables to the values of a saved grid data, and sets / draws the grid
 * 
 * @param {Object} saveItem - the object containing data of a saved grid. 
 */
function loadGrid(saveItem) {
    conwayDataArray = copyArray(saveItem.arrayData)
    canvasWidth = saveItem.width
    gridDimensions = saveItem.dimension
    setupGrid()
    drawPopulationGrid()

}

//SAVED BUTTON LIST FUNCTIONS

/**Appends to the list of saved items displayed in the DOM Sets two buttons (load / trash) to load / delete the corresponding data
 * 
 * @param {Object} savedItem -- the object containing the saved data
 */
function addSaveItemToDOM(savedItem) {
    const savedList = document.querySelector('#saved-list')
    const newSaveItem = document.createElement('div')
    const buttonsDiv = document.createElement('div')
    const infoHeader = document.createElement('h3')
    const deleteButton = document.createElement('button')
    const loadButton = document.createElement('button')
  

    newSaveItem.setAttribute('class', 'save-item')
    newSaveItem.setAttribute('id', `${savedItem.name}`)
    buttonsDiv.setAttribute('class', 'save-load-buttons')
    deleteButton.setAttribute('class', 'remove-item')
    loadButton.setAttribute('class', 'load-item')
    infoHeader.textContent = `${savedItem.name} / ${savedItem.width}px / ${savedItem.dimension}x${savedItem.dimension}`
    loadButton.textContent = 'Load'
    deleteButton.textContent = 'Trash'

    newSaveItem.appendChild(infoHeader)
    buttonsDiv.appendChild(loadButton)
    buttonsDiv.appendChild(deleteButton)
    newSaveItem.appendChild(buttonsDiv)
    savedList.appendChild(newSaveItem)
    
    loadButton.addEventListener('click', (e) => {
        const divItem = e.target.parentNode.parentNode
        loadGrid(savedData.get(divItem.id))
        updateLocalStorage()
    })

    deleteButton.addEventListener('click', (e) => {
        const divItem = e.target.parentNode.parentNode
        savedData.delete(divItem.id)
        divItem.remove()
        updateLocalStorage()
    })
}

//storage functions

/**Updates the current Map (the savedData) to local storage
 * 
 */
function updateLocalStorage() {
    const saveItemArray = Array.from(savedData.values())
    localStorage.setItem('savedGrids', JSON.stringify(saveItemArray))
}

/**
 * Load from localStorage, extracting the array of objects containign saved data and set into the map. Called when loading page.
 */
function loadFromLocalStorage() {
    const loadedArray = JSON.parse(localStorage.getItem('savedGrids'))

    loadedArray.forEach(grid => {
        savedData.set(grid.name, grid)
        addSaveItemToDOM(grid)
    })
}