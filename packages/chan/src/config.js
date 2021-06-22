
import fs from 'fs'
import findUp from 'find-up'

const configPath = findUp.sync(['.chanrc', '.chanrc.json'])

export const config = configPath ? JSON.parse(fs.readFileSync(configPath)) : {}
