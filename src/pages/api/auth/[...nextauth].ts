import NextAuth, { Session } from 'next-auth'

import Providers from 'next-auth/providers'
import { query as q } from 'faunadb'
import { fauna } from '../../../services/fauna'
import { session } from 'next-auth/client'

interface SessionProps extends Session{
    activeSubscription: unknown
}

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      scope: 'read:user'
    }),
 
  ],

  callbacks:{
      async session(session){
         try{
             
            const userActiveSubscription = await fauna.query(

                q.Get(
                   q.Intersection([
                      q.Match(
                          q.Index('subscription_ByUserRef'),
                          q.Select(
                              "ref",
                              q.Get(
                                  q.Match(
                                      q.Index('userByEmail'),
                                      q.Casefold(session.user.email)
                                  )
                              )
                          )
                      ),
                      q.Match(
                          q.Index('subscriptionByActive'),
                          "active"
                      )]


                      )
                )
            )
            return {
                ...session,
                activeSubscription: userActiveSubscription
            }
         }catch{
             return{
                 ...session,
                 activeSubscription: null
             }
         }
      },

      async signIn(user, account, profile){
      try {

        await fauna.query(
           q.If(
               q.Not(
                   q.Exists(
                       q.Match(
                           q.Index('userByEmail'),
                           q.Casefold(user.email)
                       )
                   )
               ),
               q.Create(
                q.Collection('users'),{
                    data: { email: user.email}
                }
            ),q.Get(
                q.Match(
                    q.Index('userByEmail'),
                    q.Casefold(user.email)
                )
            )
           )
        )
        return true
      } catch (error) {
          return false
      }
      
      }
  }
})