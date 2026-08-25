import fs from 'node:fs'
import { findUpSync } from 'find-up'

const configPath = findUpSync(['.chanrc', '.chanrc.json'])

export const config = configPath ? (JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>) : {}
