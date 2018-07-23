#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const download = require('../lib/download');
const generator = require('../lib/generator');
const logSymbols = require('log-symbols');
const chalk = require('chalk');

program.usage('<project-name>').parse(process.argv)

let projectName = program.args[0];

if(!projectName){
	program.help()
	return;
}

const inquirer = require('inquirer');
const list = glob.sync('*') //遍历当前目录

let next = undefined;
let rootName = path.basename(process.cwd())

if(list.length){
	if(list.filter(name=>{
		const fileName = path.resolve(process.cwd(),path.join('.',name));
		const isDir = fs.statSync(fileName).isDirectory();

		return name.indexOf(projectName) != -1 && isDir
	}).length !== 0){
		console.error(logSymbols.error,chalk.red(`项目${projectName}已经存在`));
	}else{
		 next  = Promise.resolve(projectName);
	}
	
}else if(rootName === projectName){
	
	next = inquirer.prompt([
		{
			name:'buildInCurrent',
			message:'当前目录为空，且目录名称和项目名称相同，不需要在当前目录下创建新项目',
			type:'confirm',
			default:true
		}

		]).then(answer =>{
			console.log(answer.buildInCurrent);
			return Promise.resolve(answer.buildInCurrent ? '.' : projectName);
		})



}else {
	next = Promise.resolve(projectName);
}

next && go();

function go(){
	next.then(projectRoot => {
		if(projectRoot  !=  '.'){
			fs.mkdirSync(projectRoot)
		}
		return download(projectRoot).then(target=>{
			return{
				name:projectRoot,
				root:projectRoot,
				downloadTemp:target
			}
		})
		
	}).then(context => {

		return inquirer.prompt([
			{
				name:'projectName',
				message:'项目名称',
				default:context.name
			},
			{
				name:'projectVersion',
				message:'项目版本号',
				default:'1.0.0'
			},
			{
				name:'projectDescription',
				message:'项目简介',
				default:`A project named ${context.name}`
			},
			{
				name:'uploadHost',
				message:'上传服务器地址',
				default:`127.0.0.1`
			},
			{
				name:'author',
				message:'作者',
				default:`佚名`
			}
		]).then(answer => {
			let obj= Object.assign({},context);
			let metadata = Object.assign({},answer);
			obj.metadata = metadata;
			return obj;
			
		}).catch(err => {
			return Promise.reject(err)
		})
	}).then(context => {
		
	   return generator(context.metadata,context.downloadTemp,path.parse(context.downloadTemp).dir);
	}).then((res)=>{
		
		console.log(logSymbols.success,chalk.green('创建成功:)'));
		console.log(chalk.green(`cd ${projectName}\nnpm install\nnpm run dll\nnpm run dev`));
	}).catch(err => {
		console.error(logSymbols.error,chalk.red(`创建失败：${err.message}`));
	})
}