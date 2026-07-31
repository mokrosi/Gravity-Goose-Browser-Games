const animation = {
    update(gameObj) {
        const nano = gameObj.entities.nano
        if(nano && nano.currentState) nano.currentState(gameObj);
        
        if (gameObj.entities.bugs) {
            gameObj.entities.bugs.forEach(bug => {
                bug.currentState.animation(gameObj)
            })
        }
        
        if (gameObj.entities.blocks) {
            gameObj.entities.blocks.forEach(block => {
                if(typeof block.currentState === 'function') block.currentState(gameObj)
            })
        }
        
        if (gameObj.entities.bananas) {
            gameObj.entities.bananas.forEach(banana => {
                if(banana.currentState.animation) banana.currentState.animation(gameObj)
            })
        }
    }
}