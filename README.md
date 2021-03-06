# npm-diff-install

Diff install for npm

实际项目中为了安全，一般都会把依赖的模块版本写死。而在国内一个最大的痛点就是 `npm install` 的时候非常慢，即使用私有的 registry，因为有大量的版本对比的网络请求，导致 `npm install` 也快不到哪里去。

为了让项目上线前在发布机里执行 `npm install` 更快，这里使用了一种简便的方法。

既：安装依赖后，将依赖拷贝到一个临时目录。下次安装依赖前，将之前备份的依赖拷贝过来，然后只用装没有的依赖就可以了。

真实项目中，依赖更新的频率是很低的，这样绝大部分情况下只要把上次备份的依赖拷贝过来就可以了，就会非常快。

## 如何使用

将 `diffInstall.js` 文件放在项目根目录下，然后将项目中原来 `npm install` 命令替换为下面的命令即可：

```sh
node diffInstall.js <productName>
```

依赖安装的时候，已经将 `registry` 改为 `https://registry.npm.taobao.org`，如果想用其他源的话，可以通过下面的命令：

```sh
node diffInstall.js <productName> http://registry.npm.xxx.com
```


## 问题

* 备份目录在哪里

备份目录在 `~/.diffInstlal/<productName>` 下。

* 依赖有版本更新怎么办？

这种情况一般比较少，真要出现的话，删除备份目录对应的依赖即可。


