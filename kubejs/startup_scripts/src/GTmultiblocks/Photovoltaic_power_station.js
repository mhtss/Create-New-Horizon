const { $WorkableElectricMultiblockMachine } = require("packages/com/gregtechceu/gtceu/api/machine/multiblock/$WorkableElectricMultiblockMachine")
const { $RecipeLogic } = require("packages/com/gregtechceu/gtceu/api/machine/trait/$RecipeLogic")
const { $GTRecipe } = require("packages/com/gregtechceu/gtceu/api/recipe/$GTRecipe")
const { $FormattingUtil } = require("packages/com/gregtechceu/gtceu/utils/$FormattingUtil")

GTCEuStartupEvents.registry('gtceu:recipe_type',event =>{
    event.create('photovoltaic_power')
        .category('ctnh')
        .setEUIO('out')
        .setMaxIOSize(0, 0, 1, 0)
        .setSlotOverlay(false, false, GuiTextures.SOLIDIFIER_OVERLAY)
        .setProgressBar(GuiTextures.PROGRESS_BAR_ARROW_MULTIPLE, FillDirection.LEFT_TO_RIGHT)
        .setSound(GTSoundEntries.COOLING)
})
GTCEuStartupEvents.registry('gtceu:machine', event =>{
    const EURecipeCapability = Java.loadClass('com.gregtechceu.gtceu.api.capability.recipe.EURecipeCapability')
    const $GTUtil = Java.loadClass('com.gregtechceu.gtceu.utils.GTUtil')
    event.create('photovoltaic_power_station_energetic','multiblock')
        .rotationState(RotationState.NON_Y_AXIS)
        .recipeType('photovoltaic_power')
        .recipeModifier((/**@type {$WorkableElectricMultiblockMachine}*/machine, /**@type {$GTRecipe}*/recipe) => {
            let level = machine.level
            let time = machine.level.dayTime()
            let rate = Math.sin(time/12000 * Math.PI)
            let basic_rate = 1
            if(level.dimension == 'minecraft:overworld' || level.dimension == 'twilightforest:twilight_forest' || level.dimension == 'mythicbotany:alfheim'){
                rate *= 1
            }
            else if(level.dimension == 'aether:the_aether'){
                rate *= 2
            }
            else if(level.dimension == 'ad_astra:moon' || level.dimension == 'ad_astra:moon_orbit'){
                rate *= 4
            }
            else if(level.dimension == 'ad_astra:venus' || level.dimension == 'ad_astra:venus_orbit'){
                rate *= 6
            }
            else if(level.dimension == 'ad_astra:mercury' || level.dimension == 'ad_astra:mercury_orbit'){
                rate *= 16
            }
            else if(level.dimension == 'ad_astra:mars' || level.dimension == 'ad_astra:mars_orbit'){
                rate *= 2
            }
            else if(level.dimension == 'ad_astra:glacio' || level.dimension == 'ad_astra:glacio_orbit'){
                rate *= 32
            }
            let newrecipe = recipe.copy()
            newrecipe.tickOutputs.put(EURecipeCapability.CAP,newrecipe.copyContents(newrecipe.tickOutputs,ContentModifier.of(rate*basic_rate,0)).get(EURecipeCapability.CAP))
            machine.getHolder().self().persistentData.putFloat('energy',rate*basic_rate*512)
            return newrecipe
        })
        //.appearanceBlock(GTBlocks.get('kubejs:manasteel_casing'))
        .pattern(definition => FactoryBlockPattern.start()
            .aisle("AAAAAAA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("AAA@AAA") 
            .where("A", Predicates.blocks("kubejs:reflect_light_casing")
                    .or(Predicates.autoAbilities(definition.getRecipeTypes())))
            .where("B", Predicates.blocks("kubejs:energetic_photovoltaic_block"))
            .where("@", Predicates.controller(Predicates.blocks(definition.get())))
            .build()
        )
        .beforeWorking((/**@type {$WorkableElectricMultiblockMachine}*/machine,recipe)=>{
            if(machine.level.dayTime() > 12000){
                machine.recipeLogic.interruptRecipe()
                return false
            }
            let facing = machine.frontFacing
            let pos = machine.self().holder.pos()
            
            if(facing.equals(Direction.WEST)){
                for(let x = 1; x < 6; x++){
                    for(let z = -2; z < 2; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            else if(facing.equals(Direction.EAST)){
                for(let x = -5; x < 0; x++){
                    for(let z = -2; z < 2; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            else if(facing.equals(Direction.NORTH)){
                for(let x = -2; x < 2; x++){
                    for(let z = 1; z < 6; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            else{
                for(let x = -2; x < 2; x++){
                    for(let z = -5; z < 0; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            return true
        })
        .additionalDisplay((machine,l) =>{
            if(machine.isForm()){
                let valid = machine.getHolder().self().persistentData.getBoolean('valid')
                if(valid == null){
                    valid = true
                }
                let outputEnergy = machine.getHolder().self().persistentData.getFloat('energy')
                if(outputEnergy == null){
                    outputEnergy = 0
                }
                let voltageName = GTValues.VNF[$GTUtil.getTierByVoltage(outputEnergy)]
                if(!valid){
                    l.add(l.size(), Text.translate("multiblock.ctnh.photovoltaic_power_station_invalid").red())
                }
                l.add(l.size(), Text.translate("multiblock.ctnh.photovoltaic_power_station1",(outputEnergy/512).toFixed(1)))
                l.add(l.size(), Text.translate("multiblock.ctnh.photovoltaic_power_station2",$FormattingUtil.formatNumbers(outputEnergy), voltageName))
            }
        })
        .workableCasingRenderer('kubejs:block/reflect_light_casing',  'gtceu:block/multiblock/generator/large_steam_turbine', false)
})

GTCEuStartupEvents.registry('gtceu:machine', event =>{
    const EURecipeCapability = Java.loadClass('com.gregtechceu.gtceu.api.capability.recipe.EURecipeCapability')
    const $GTUtil = Java.loadClass('com.gregtechceu.gtceu.utils.GTUtil')
    event.create('photovoltaic_power_station_pulsating','multiblock')
        .rotationState(RotationState.NON_Y_AXIS)
        .recipeType('photovoltaic_power')
        .recipeModifier((/**@type {$WorkableElectricMultiblockMachine}*/machine, /**@type {$GTRecipe}*/recipe) => {
            let level = machine.level
            let time = machine.level.dayTime()
            let rate = Math.sin(time/12000 * Math.PI)
            let basic_rate = 4
            if(level.dimension == 'minecraft:overworld' || level.dimension == 'twilightforest:twilight_forest' || level.dimension == 'mythicbotany:alfheim'){
                rate *= 1
            }
            else if(level.dimension == 'aether:the_aether'){
                rate *= 2
            }
            else if(level.dimension == 'ad_astra:moon' || level.dimension == 'ad_astra:moon_orbit'){
                rate *= 4
            }
            else if(level.dimension == 'ad_astra:venus' || level.dimension == 'ad_astra:venus_orbit'){
                rate *= 6
            }
            else if(level.dimension == 'ad_astra:mercury' || level.dimension == 'ad_astra:mercury_orbit'){
                rate *= 16
            }
            else if(level.dimension == 'ad_astra:mars' || level.dimension == 'ad_astra:mars_orbit'){
                rate *= 2
            }
            else if(level.dimension == 'ad_astra:glacio' || level.dimension == 'ad_astra:glacio_orbit'){
                rate *= 32
            }
            let newrecipe = recipe.copy()
            newrecipe.tickOutputs.put(EURecipeCapability.CAP,newrecipe.copyContents(newrecipe.tickOutputs,ContentModifier.of(rate*basic_rate,0)).get(EURecipeCapability.CAP))
            machine.getHolder().self().persistentData.putFloat('energy',rate*basic_rate*512)
            return newrecipe
        })
        //.appearanceBlock(GTBlocks.get('kubejs:manasteel_casing'))
        .pattern(definition => FactoryBlockPattern.start()
            .aisle("AAAAAAA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("AAA@AAA") 
            .where("A", Predicates.blocks("kubejs:reflect_light_casing")
                    .or(Predicates.autoAbilities(definition.getRecipeTypes())))
            .where("B", Predicates.blocks("kubejs:pulsating_photovoltaic_block"))
            .where("@", Predicates.controller(Predicates.blocks(definition.get())))
            .build()
        )
        .beforeWorking((/**@type {$WorkableElectricMultiblockMachine}*/machine,recipe)=>{
            if(machine.level.dayTime() > 12000){
                machine.recipeLogic.interruptRecipe()
                return false
            }
            let facing = machine.frontFacing
            let pos = machine.self().holder.pos()
            
            if(facing.equals(Direction.WEST)){
                for(let x = 1; x < 6; x++){
                    for(let z = -2; z < 2; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            else if(facing.equals(Direction.EAST)){
                for(let x = -5; x < 0; x++){
                    for(let z = -2; z < 2; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            else if(facing.equals(Direction.NORTH)){
                for(let x = -2; x < 2; x++){
                    for(let z = 1; z < 6; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            else{
                for(let x = -2; x < 2; x++){
                    for(let z = -5; z < 0; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            return true
        })
        .additionalDisplay((machine,l) =>{
            if(machine.isForm()){
            let valid = machine.getHolder().self().persistentData.getBoolean('valid')
            if(valid == null){
                valid = true
            }
            let outputEnergy = machine.getHolder().self().persistentData.getFloat('energy')
            if(outputEnergy == null){
                outputEnergy = 0
            }
            let voltageName = GTValues.VNF[$GTUtil.getTierByVoltage(outputEnergy)]
            if(!valid){
                l.add(l.size(), Text.translate("multiblock.ctnh.photovoltaic_power_station_invalid").red())
            }
			l.add(l.size(), Text.translate("multiblock.ctnh.photovoltaic_power_station1",(outputEnergy/2048*100).toFixed(1)))
			l.add(l.size(), Text.translate("multiblock.ctnh.photovoltaic_power_station2",$FormattingUtil.formatNumbers(outputEnergy), voltageName))
            }
        })
        .workableCasingRenderer('kubejs:block/reflect_light_casing',  'gtceu:block/multiblock/generator/large_steam_turbine', false)
})

GTCEuStartupEvents.registry('gtceu:machine', event =>{
    const EURecipeCapability = Java.loadClass('com.gregtechceu.gtceu.api.capability.recipe.EURecipeCapability')
    const $GTUtil = Java.loadClass('com.gregtechceu.gtceu.utils.GTUtil')
    event.create('photovoltaic_power_station_vibrant','multiblock')
        .rotationState(RotationState.NON_Y_AXIS)
        .recipeType('photovoltaic_power')
        .recipeModifier((/**@type {$WorkableElectricMultiblockMachine}*/machine, /**@type {$GTRecipe}*/recipe) => {
            let level = machine.level
            let time = machine.level.dayTime()
            let rate = Math.sin(time/12000 * Math.PI)
            let basic_rate = 16
            if(level.dimension == 'minecraft:overworld' || level.dimension == 'twilightforest:twilight_forest' || level.dimension == 'mythicbotany:alfheim'){
                rate *= 1
            }
            else if(level.dimension == 'aether:the_aether'){
                rate *= 2
            }
            else if(level.dimension == 'ad_astra:moon' || level.dimension == 'ad_astra:moon_orbit'){
                rate *= 4
            }
            else if(level.dimension == 'ad_astra:venus' || level.dimension == 'ad_astra:venus_orbit'){
                rate *= 6
            }
            else if(level.dimension == 'ad_astra:mercury' || level.dimension == 'ad_astra:mercury_orbit'){
                rate *= 16
            }
            else if(level.dimension == 'ad_astra:mars' || level.dimension == 'ad_astra:mars_orbit'){
                rate *= 2
            }
            else if(level.dimension == 'ad_astra:glacio' || level.dimension == 'ad_astra:glacio_orbit'){
                rate *= 32
            }
            let newrecipe = recipe.copy()
            newrecipe.tickOutputs.put(EURecipeCapability.CAP,newrecipe.copyContents(newrecipe.tickOutputs,ContentModifier.of(rate*basic_rate,0)).get(EURecipeCapability.CAP))
            machine.getHolder().self().persistentData.putFloat('energy',rate*basic_rate*512)
            return newrecipe
        })
        //.appearanceBlock(GTBlocks.get('kubejs:manasteel_casing'))
        .pattern(definition => FactoryBlockPattern.start()
            .aisle("AAAAAAA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("ABBBBBA") 
            .aisle("AAA@AAA") 
            .where("A", Predicates.blocks("kubejs:reflect_light_casing")
                    .or(Predicates.autoAbilities(definition.getRecipeTypes())))
            .where("B", Predicates.blocks("kubejs:vibrant_photovoltaic_block"))
            .where("@", Predicates.controller(Predicates.blocks(definition.get())))
            .build()
        )
        .beforeWorking((/**@type {$WorkableElectricMultiblockMachine}*/machine,recipe)=>{
            if(machine.level.dayTime() > 12000){
                machine.recipeLogic.interruptRecipe()
                return false
            }
            let facing = machine.frontFacing
            let pos = machine.self().holder.pos()
            
            if(facing.equals(Direction.WEST)){
                for(let x = 1; x < 6; x++){
                    for(let z = -2; z < 2; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            else if(facing.equals(Direction.EAST)){
                for(let x = -5; x < 0; x++){
                    for(let z = -2; z < 2; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            else if(facing.equals(Direction.NORTH)){
                for(let x = -2; x < 2; x++){
                    for(let z = 1; z < 6; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            else{
                for(let x = -2; x < 2; x++){
                    for(let z = -5; z < 0; z++){
                        if(!machine.level.getBlock(pos.offset(x,0,z)).canSeeSky()){
                            machine.recipeLogic.interruptRecipe()
                            machine.getHolder().self().persistentData.putBoolean('valid',false)
                            return false
                        }
                    }
                }
            }
            return true
        })
        .additionalDisplay((machine,l) =>{
            if(machine.isForm()){
            let valid = machine.getHolder().self().persistentData.getBoolean('valid')
            if(valid == null){
                valid = true
            }
            let outputEnergy = machine.getHolder().self().persistentData.getFloat('energy')
            if(outputEnergy == null){
                outputEnergy = 0
            }
            let voltageName = GTValues.VNF[$GTUtil.getTierByVoltage(outputEnergy)]
            if(!valid){
                l.add(l.size(), Text.translate("multiblock.ctnh.photovoltaic_power_station_invalid").red())
            }
			l.add(l.size(), Text.translate("multiblock.ctnh.photovoltaic_power_station1",(outputEnergy/8192*100).toFixed(1)))
			l.add(l.size(), Text.translate("multiblock.ctnh.photovoltaic_power_station2",$FormattingUtil.formatNumbers(outputEnergy), voltageName))
            }
        })
        .workableCasingRenderer('kubejs:block/reflect_light_casing',  'gtceu:block/multiblock/generator/large_steam_turbine', false)
})