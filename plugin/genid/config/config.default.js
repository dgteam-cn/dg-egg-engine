'use strict';

exports.genid = {
    client: {
        Method: 1, // 雪花计算方法，（1-漂移算法|2-传统算法），默认 1
        BaseTime: 1640966400000,  // 基础时间（ms 单位），不能超过当前系统时间
        WorkerId: 1, // 机器码，必须由外部设定，最大值 2^WorkerIdBitLength-1
        WorkerIdBitLength: 6,   // 机器码位长，默认值 6，取值范围 [1, 15](要求：序列数位长+机器码位长不超过 22)
        SeqBitLength: 6,   // 序列数位长，默认值 6，取值范围 [3, 21](要求：序列数位长+机器码位长不超过 22)
        MaxSeqNumber: 0, // 最大序列数（含），设置范围 [MinSeqNumber, 2^SeqBitLength-1]，默认值 0，表示最大序列数取最大值（2^SeqBitLength-1]）
        MinSeqNumber: 5, // 最小序列数（含），默认值 5，取值范围 [5, MaxSeqNumber]，每毫秒的前 5 个序列数对应编号 0-4 是保留位，其中 1-4 是时间回拨相应预留位，0 是手工新值预留位
        TopOverCostCount: 2000// 最大漂移次数（含），默认 2000，推荐范围 500-10000（与计算能力有关）
    }
}