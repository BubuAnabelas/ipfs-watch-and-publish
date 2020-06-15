const fs = require('fs')
const path = require('path')
const slash = require('slash')
const chokidar = require('chokidar')
const IpfsHttpClient = require('ipfs-http-client')
const logger = require('./logger')

let config = require('../.config')
const defaultConfig = {
	watcherTime: 1000 * 60,
	republishTime: 1000 * 60 * 60 * 24,
	watchDirectory: './',
	baseDirectory: '/ipfs-watch-and-publish',
	publishKey: 'self',
	ignoredFiles: /(^|[\/\\])\../
}
config = { ...defaultConfig, ...config }

if (config.baseDirectory === '/' || !config.baseDirectory.startsWith('/'))
	throw new Error("config.baseDirectory is not valid")

const timers = {
	republish: null,
	watcherSleep: null
}

const watcher = chokidar.watch(path.resolve(config.watchDirectory), {
	ignored: config.ignoredFiles
})

const ipfs = IpfsHttpClient()

const generateMfsPath = (paths) => {
	paths = path.relative(path.resolve(config.watchDirectory), paths)
	const filePath = path.parse(path.relative('./', paths))
	return slash(path.join(config.baseDirectory, filePath.dir, filePath.base))
}

const handleAddFile = async (paths) => {
	try {
		const mfsPath = generateMfsPath(paths)
		await ipfs.files.write(mfsPath, fs.createReadStream(paths, {encoding: 'utf8'}), {create: true, parents: true})
		console.debug(`handleAddFile - Added: ${mfsPath}`)
	} catch (ex) {
		logger.error(`handleAddFile - ${paths} - Error: ${ex}`)
	}
}

const handleRemoveFile = async (paths) => {
	try {
		const mfsPath = generateMfsPath(paths)
		await ipfs.files.rm(mfsPath, {recursive: true})
		console.debug(`handleRemoveFile - Removed: ${mfsPath}`)
	} catch (ex) {
		logger.error(`handleRemoveFile - ${paths} - Error: ${ex}`)
	}
}

const handleAddDirectory = async (paths) => {
	try {
		const mfsPath = generateMfsPath(paths)
		await ipfs.files.mkdir(mfsPath, {parents: true})
		console.debug(`handleAddDirectory - Added: ${mfsPath}`)
	} catch (ex) {
		logger.error(`handleAddDirectory - ${paths} - Error: ${ex}`)
	}
}


watcher.on('all', async (event, paths) => {
	logger.debug(`Watcher - Event: ${event} - ${paths}`)
	switch (event) {
		case 'add':
		case 'change':
			await handleAddFile(paths)
			break
		case 'addDir':
			await handleAddDirectory(paths)
			break
		case 'unlink':
			await handleRemoveFile(paths)
			break
		case 'unlinkDir':
			await handleRemoveFile(paths)
			break
		default:
			logger.error(`Watcher - Event: ${event} - ${paths} - Error: ${ex}`)
	}

	clearInterval(timers.republish)
	clearTimeout(timers.watcherSleep)
	timers.watcherSleep = setTimeout(() => {
		publishIpns()
		timers.republish = setInterval(publishIpns, config.republishTime)
	}, config.watcherTime)
})


const publishIpns = async () => {
	logger.debug(`publishIpns - Start publish`)
	try {
		for await (const file of ipfs.files.ls(generateMfsPath(path.join(config.baseDirectory, '..'))))
			if (generateMfsPath(file.name) === config.baseDirectory) {
				logger.debug(`publishIpns - Folder to be published found`)
				const res = await ipfs.name.publish(file.cid)
				logger.info(`publishIpns - Published to ${res.name}: ${res.value}`)
				logger.debug(`publishIpns - Finish publishing`)
				return
			}

	} catch (ex) {
		logger.error(`publishIpns - Error: ${ex}`)
	}

	logger.info(`publishIpns - Nothing found to publish `)

}

logger.info(`Daemon started`)
