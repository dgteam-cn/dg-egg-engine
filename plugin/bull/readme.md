const Queue = require('bull')

// See: https://github.com/OptimalBits/bull#readme
// And: https://optimalbits.github.io/bull/
// And: https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md

module.exports = app => {
    //  app.logger.info('queue')
    // {
    //     redis: {
    //         port: 6379,
    //         host: 'localhost',
    //         password: '',
    //         db: 10
    //     },
    //     prefix: 'queue', // 数据库前缀
    //     defaultJobOptions: {
    //         // priority: 1, // Number 优先级
    //         delay: 0, // Number 迟处理时间（毫秒）
    //         attempts: 2, // Number 在作业完成之前尝试该作业的总次数
    //         // repeat: {},
    //         backoff: false, // 如果作业失败，自动重试的退避设置，默认策略：fixed
    //         // lifo: false, // Boolean 是否先进后出，默认 false
    //         // jobId: 1, // Number 用于覆盖作业 ID
    //         // timeout: 10000, // Number 作业超时错误的判定时间（毫秒）
    //         removeOnComplete: true, // Boolean | Number  | KeepJobs 作业完成后将其删除；如果传入数字则表示作业保留数量
    //         removeOnFail: true // Boolean | Number 作业在所有尝试失败后，将其删除；如果传入数字则表示作业保留数量
    //         // stackTraceLimit: 100 // Number 限制将记录在stacktrace中的堆栈跟踪行的数量
    //     },
    //     limiter: {
    //         max: 300000, // Number 处理的最大作业数
    //         duration: 1000 //Number 每持续时间（毫秒）
    //         // bounceBack: false, // Boolean 当作业受到速率限制时，它们会留在等待队列中，而不会移动到延迟队列中
    //         // groupKey: '' // String
    //     },
    //     settings: {
    //         // lockDuration: 30000, // Number=30000 工作锁的密钥过期时间
    //         // lockRenewTime: 15000, // Number=15000 获取作业锁的时间间隔
    //         // stalledInterval: 30000, // Number=30000 检查暂停作业的频率（使用0表示从不检查）
    //         maxStalledCount: 1, // 重新处理暂停作业的最大次数
    //         guardInterval: 1000, // Number=5000 延迟作业和添加作业的轮询间隔
    //         retryProcessDelay: 1000 // Number=5000如果出现内部错误，则在处理下一个作业之前延迟。
    //         // drainDelay: 5, // A timeout for when the queue is in drained state (empty waiting for jobs)
    //         // isSharedChildPool: false // enables multiple queues on the same instance of child pool to share the same instance.
    //     }
    // }
    const queue = new Queue('testqueue', app.config.bull)


    // add(name?: string, data: object, opts?: JobOpts): Promise<Job>
    // queue.add({type: 'test 2', date: app.helper.time(new Date(), 'hh:mm:ss')}, {
    //     // jobId: 1, // String | Number 可以指定 jobId 但是无法重复添加相同主键
    //     delay: 4000 // Number 延迟执行
    //     // removeOnComplete: true // 成功后自动删除
    // }).then(job => {

    //     console.log('\nJob created successfully. \n', {id: job.id, timestamp: job.timestamp, delay: job.delay}, '\n')

    //     setTimeout(() => {
    //         queue.getJob(job.id).then(job => {

    //             // job.update({type: 'test update'}) // 更新 job 数据包
    //             // job.remove() // 从队列和可能包含作业的任何列表中删除作业。
    //             // job.retry() // 重新运行失败的 job
    //             // job.discard() // 确保已经失败的作业不在自动 retry
    //             // job.promote() // 将当前 "延迟中" 的作业升级为 "等待中" 状态并尽快执行
    //             // job.finished() // 返回在作业完成或失败时解析或拒绝的承诺

    //             // job.moveToCompleted() // 移动到 "已完成" 队列
    //             // job.moveToCompleted() // 移动到 "已失败" 队列
    //         })
    //     }, 1000)
    // })


    // 监听队列回调
    queue.process(function(job, done) {

        console.log('\n[queue] data:', job.data, 'opts: ', job.opts, '\n')

        done()

        // // 异步转码图像并报告进度
        // job.progress(42);

        // // 通话结束后完成
        // done();

        // // 如果有错误，请给出一个错误
        // done(new Error('error transcoding'));

        // // 或者通过一个结果
        // done(null, {width: 1280, height: 720 /* etc... */});

        // // 如果作业引发未处理的异常，也会正确处理
        // throw new Error('some unexpected error');
    })

    // queue.pause().then(function () {
    //     // 队列现在会处于暂停阶段
    // })

    // queue.resume().then(function () {
    //     // 队列现在会恢复
    // })

    return queue
}