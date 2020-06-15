module.exports = {
	watcherTime: 1000 * 60, // time to wait for the watcher to stop recieving events before publishing again
	republishTime: 1000 * 60 * 60 * 24, // time to wait for republishing the whole thing
	//watchDirectory: './', // Filesystem folder
	watchDirectory: './',
	baseDirectory: '/ipfs-watch-and-publish', // IPFS MFS folder
	publishKey: 'self', // See `ipfs key`
	ignoredFiles: /(^|[\/\\])\../ // ignore dotfiles
}
