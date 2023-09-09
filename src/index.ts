import dayjs from 'dayjs'
import { Decimal } from '@prisma/client/runtime/library'

class Check {

  async rerunCalculateLocabonus (input: any) {
    console.log("start");
    const { day, month, year, hour } = input
    const time = dayjs()
      .set('year', year)
      .set('month', month - 1)
      .set('date', day)
      .set('hour', hour)
      .set('minute', 0)
      .set('second', 0)
      .set('millisecond', 0)
      .toDate()
    const start = dayjs(time).add(-1, 'hour').toDate()
    // const meetToEarnRecord = await this.prisma.meet_to_earn_record.aggregate({
    //   where: { created_at: { gte: start, lt: time } },
    //   _count: true,
    //   _sum: { request_user_point: true, connect_user_point: true },
    // })
    // const useToEarnRecord = await this.prisma.use_to_earn_record.aggregate({
    //   where: { created_at: { gte: start, lt: time } },
    //   _count: true,
    //   _sum: { point: true },
    // })

    // const totalMeetPoint = meetToEarnRecord._sum.request_user_point
    //   ? meetToEarnRecord._sum.request_user_point +
    //   meetToEarnRecord._sum.connect_user_point
    //   : 0
    const totalMeetPoint = 122.223;
    const totalUserPoint =  0
    const totalPoint = totalMeetPoint + totalUserPoint
    if (!totalPoint) return
    // const tokenInDay = await this.prisma.token_per_day.findFirst({
    //   where: { end_at: { gte: time }, start_at: { lte: start } },
    // })
    const tokenInDay = {
      token: new Decimal(30000)
    }
    const tokenInHour = tokenInDay
      ? tokenInDay.token.div(24)
      : new Decimal(10000).div(24)
    const tokenPerPoint = tokenInHour.div(totalPoint)
    const meetToEarn:any = [
      {
        request_user_point:0,
        connect_user_point: 0,
        nft_owner_id: 0,
        nft_owner_company: 0,
        nft_owner_ref_id: 0,
        nft_owner_ref2_id: 0,
        request_user_ref_id: 0,
        connect_user_ref_id: 0,
        is_blacklist: false,
        sleep_time: false,
      }
    ]
    // const useToEarn = await this.prisma.use_to_earn_record.findMany({
    //   where: { created_at: { gte: start, lt: time }, user_amt: null },
    // })

    const locaLimit = 10
    const locaLimitNight = 2
    const locaLimitUseToEarn = 7
    const meetToEarnData = meetToEarn.map((record:any) => {
      const recordAmount = this.calculateMeetToEarnRecord(
        record,
        tokenPerPoint,
        locaLimit,
        locaLimitNight,
      )
      return {
        ...record,
        ...recordAmount,
      }
    })

    console.log(meetToEarnData)
    // for (let i = 0; i < meetToEarnData.length; i++) {
    //   await this.createMeetToEarnTransaction(meetToEarnData[i], time)
    // }
    // const useToEarnData = useToEarn.map((record) => {
    //   const recordAmount = this.calculateUseToEarnRecord(
    //     record,
    //     tokenPerPoint,
    //     locaLimitUseToEarn,
    //     locaLimitNight,
    //   )
    //   return {
    //     ...record,
    //     ...recordAmount,
    //   }
    // })

    // for (let i = 0; i < useToEarnData.length; i++) {
    //   await this.createUseToEarnTransaction(useToEarnData[i]);
    // }
    // const lastRecord = await this.prisma.release_token_history.findFirst({
    //   where: { release_at: { lte: start } },
    //   orderBy: { release_at: 'desc' },
    // });
    // const release = await this.prisma.release_token_history.create({
    //   data: {
    //     release_at: time,
    //     nums_of_actions:
    //       (meetToEarnRecord._count || 0) + (useToEarnRecord._count || 0),
    //     token: tokenInHour,
    //   },
    // });
    // const md5HashValue = JSON.stringify({
    //   token: tokenInHour,
    //   nums_of_actions: release.nums_of_actions,
    //   release_at: release.release_at,
    //   transaction_id: release.id,
    //   last_hour_actions: lastRecord?.nums_of_actions || 0,
    // });
    // const md5Data = md5(md5HashValue);
    // await this.prisma.release_token_history.update({
    //   where: {
    //     id: release.id,
    //   },
    //   data: {
    //     md5: md5Data,
    //     md5_value: md5HashValue,
    //   },
    // });
  }

  /** Tính toán token user meet tặng */

  calculateMeetToEarnRecord (
    record: any,
    tokenPerPoint: Decimal,
    localLimit: number,
    localLimitNight: number,
  ) {
    const {
      request_user_point,
      connect_user_point,
      nft_owner_id,
      nft_owner_company,
      nft_owner_ref_id,
      nft_owner_ref2_id,
      request_user_ref_id,
      connect_user_ref_id,
      is_blacklist,
      sleep_time,
    } = record
    let request_total_amt = tokenPerPoint.mul(request_user_point)
    let connect_total_amt = tokenPerPoint.mul(connect_user_point)
    let exceed_limit_amt = new Decimal(0)
    const limit = sleep_time === true ? localLimitNight : localLimit
    if (request_total_amt.greaterThan(limit)) {
      exceed_limit_amt = exceed_limit_amt.plus(request_total_amt.minus(limit))
      request_total_amt = new Decimal(limit)
    }
    if (connect_total_amt.greaterThan(limit)) {
      exceed_limit_amt = exceed_limit_amt.plus(connect_total_amt.minus(limit))
      connect_total_amt = new Decimal(limit)
    }
    const request_user_amt = request_total_amt.mul(70).div(100)
    const connect_user_amt = connect_total_amt.mul(70).div(100)
    const request_user_ref_percent = request_user_ref_id ? 1 : 0
    const connect_user_ref_percent = connect_user_ref_id ? 1 : 0
    const request_user_ref_amt = request_total_amt
      .mul(request_user_ref_percent)
      .div(100)
    const connect_user_ref_amt = connect_total_amt
      .mul(connect_user_ref_percent)
      .div(100)
    if (!is_blacklist) {
      const nft_owner_percent = nft_owner_id ? 20 : 0
      let nft_owner_company_percent = 0
      if (!!nft_owner_company) {
        if (nft_owner_company === nft_owner_id) {
          nft_owner_company_percent = 4
        } else if (
          nft_owner_company === nft_owner_ref_id ||
          !nft_owner_ref2_id
        ) {
          nft_owner_company_percent = 2
        } else {
          nft_owner_company_percent = 1
        }
      }
      const nft_owner_ref_percent =
        nft_owner_ref_id && nft_owner_company_percent !== 4 ? 2 : 0
      const nft_owner_ref2_percent =
        nft_owner_ref2_id &&
        nft_owner_company_percent !== 4 &&
        nft_owner_company_percent !== 2
          ? 1
          : 0
      const nft_owner_amt_1 = request_total_amt
        .mul(nft_owner_percent)

        .div(100)
      const nft_owner_amt_2 = connect_total_amt
        .mul(nft_owner_percent)

        .div(100)
      const nft_owner_ref_amt_1 = request_total_amt
        .mul(nft_owner_ref_percent)

        .div(100)
      const nft_owner_ref_amt_2 = connect_total_amt
        .mul(nft_owner_ref_percent)

        .div(100)
      const nft_owner_ref2_amt_1 = request_total_amt
        .mul(nft_owner_ref2_percent)

        .div(100)
      const nft_owner_ref2_amt_2 = connect_total_amt
        .mul(nft_owner_ref2_percent)

        .div(100)
      const nft_owner_company_amt_1 = request_total_amt
        .mul(nft_owner_company_percent)

        .div(100)
      const nft_owner_company_amt_2 = connect_total_amt
        .mul(nft_owner_company_percent)

        .div(100)
      const dao_amt_1 = request_total_amt
        .minus(request_user_amt)
        .minus(request_user_ref_amt)
        .minus(nft_owner_amt_1)
        .minus(nft_owner_ref_amt_1)
        .minus(nft_owner_ref2_amt_1)
        .minus(nft_owner_company_amt_1)
      const dao_amt_2 = connect_total_amt
        .minus(connect_user_amt)
        .minus(connect_user_ref_amt)
        .minus(nft_owner_amt_2)
        .minus(nft_owner_ref_amt_2)
        .minus(nft_owner_ref2_amt_2)
        .minus(nft_owner_company_amt_2)
      return {
        request_user_amt,
        request_user_ref_amt,
        connect_user_amt,
        connect_user_ref_amt,
        nft_owner_amt: nft_owner_amt_1.plus(nft_owner_amt_2),
        nft_owner_ref_amt: nft_owner_ref_amt_1.plus(nft_owner_ref_amt_2),
        nft_owner_ref2_amt: nft_owner_ref2_amt_1.plus(nft_owner_ref2_amt_2),
        nft_owner_company_amt: nft_owner_company_amt_1.plus(
          nft_owner_company_amt_2,
        ),
        dao_amt: dao_amt_1.plus(dao_amt_2),
        exceed_limit_amt,
      }
    } else {
      const dao_amt_1 = request_total_amt
        .minus(request_user_amt)
        .minus(request_user_ref_amt)
      const dao_amt_2 = connect_total_amt
        .minus(connect_user_amt)
        .minus(connect_user_ref_amt)
      return {
        request_user_amt,
        request_user_ref_amt,
        connect_user_amt,
        connect_user_ref_amt,
        nft_owner_amt: new Decimal(0),
        nft_owner_ref_amt: new Decimal(0),
        nft_owner_ref2_amt: new Decimal(0),
        nft_owner_company_amt: new Decimal(0),
        dao_amt: dao_amt_1.plus(dao_amt_2),
        exceed_limit_amt,
      }
    }
  }
}
 new Check().rerunCalculateLocabonus({
   day: 1,
   month: 9,
   year: 2023,
   hour: 22
 }).then()
