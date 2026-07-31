const movement = {
    update(gameObj) {
        if (gameObj.entities.bugs) {
            gameObj.entities.bugs.forEach(bug => {
                if(bug.currentState.movement) bug.currentState.movement(gameObj)
            })
        }
        if (gameObj.entities.bananas) {
            gameObj.entities.bananas.forEach(banana => {
                if(banana.currentState.movement) banana.currentState.movement(gameObj)
            })
        }
        if (gameObj.entities.nano && gameObj.entities.nano.automove) {
            gameObj.entities.nano.automove();
        }
    }
}