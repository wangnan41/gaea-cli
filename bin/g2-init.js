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
		return inquirer.prompt([
			{
				name:'projectName',
				message:'项目名称',
				default:'gaea-init'
			},
			{
				name:'projectVersion',
				message:'项目版本号',
				default:'1.0.0'
			},
			{
				name:'projectDescription',
				message:'项目简介',
				default:`A project named gaea-init`
			},
			{
				name:'uploadHost',
				message:'上传服务器地址',
				default:`你知道的73服务器`
			},
			{
				name:'author',
				message:'作者',
				default:`佚名`
			},
			{	
				name:'bucket',
				type:'checkbox',
				message:'第三方依赖库(多选)',
				choices:
				[{
					name:'vue',
					checked:true
				},{
					name:'axios',
					checked:true
				},{
					name:'vue-router',
					checked:true
				},{
					name:'qs',
					checked:true
				},{
					name:'vuex',
					checked:false
				}]
			}
		]).then(answer => {
			let obj= {};
			let metadata = Object.assign({},answer);
			obj.metadata = metadata;
			return obj;
			
		}).then((obj) => {
			
			let hasVuex = 1;

			if(obj.metadata.bucket.indexOf('vuex')!=-1){
				hasVuex = 2;
			}
			return download(hasVuex,projectRoot).then(target=>{
				
				obj.name = projectRoot;
				obj.root = projectRoot;
				obj.downloadTemp = target;
				return obj;
			})
		
		}).catch(err => {
			return Promise.reject(err)
		})
	}).then(context => {
		
	   return generator(context.metadata,context.downloadTemp,path.parse(context.downloadTemp).dir);
	}).then((res)=>{
		
		console.log(logSymbols.success,chalk.green('创建成功:)'));
		console.log(chalk.green(`cd ${projectName}\nnpm install\nnpm run dll(预编译第三方依赖库)\nnpm run dev(本地开发)\nnpm run build(本地编译打包)\nnpm run upload(本地编译打包加上传测试服务器)`));
	}).catch(err => {
		console.error(logSymbols.error,chalk.red(`创建失败：${err.message}`));
	})
}