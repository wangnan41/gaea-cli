const download = require('download-git-repo');
const ora = require('ora');
const path = require('path');

module.exports = function(target){
	target = path.join(target || '.','download-temp');
	return new Promise(function(resolve,reject) {

		const url = 'wangnan19900401/gaea';
		const spinner = ora(`正在下载项目模版`);
		spinner.start();
		download(url,
			target,
			(err)=>{
				if(err){
					spinner.fail();
					reject(err);
				}else{
					spinner.succeed();
					resolve(target);
				}
			})
	})

}