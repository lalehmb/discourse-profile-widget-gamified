import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import { avatarImg } from 'discourse/widgets/post';
import { cook } from 'discourse/lib/text';
import RawHtml from 'discourse/widgets/raw-html';
import showModal from 'discourse/lib/show-modal';
import TextLib from 'discourse/lib/text';


export default createWidget('profile', {
  tagName: 'div.user-profile.widget-container',
  buildKey: (attrs) => 'user-profile',

  defaultState(attrs) {
    return {
      topic: attrs.topic,
      cooked: false,
      cookedData: [],
      bookmarked: attrs.topic ? attrs.topic.bookmarked : null
    }
  },

  canInviteToForum() {
    return Discourse.User.currentProp('can_invite_to_forum');
  },

  toggleBookmark() {
    this.state.bookmarked = !this.state.bookmarked
    const topicController = this.register.lookup('controller:topic')
    topicController.send('toggleBookmark')
  },

  sendShowLogin() {
    const appRoute = this.register.lookup('route:application');
    appRoute.send('showLogin');
  },

  sendShowCreateAccount() {
    const appRoute = this.register.lookup('route:application');
    appRoute.send('showCreateAccount');
  },

  showInvite() {
    const topicRoute = this.register.lookup('route:topic');
    topicRoute.send('showLogin');
  },

  html(attrs, state) {
    const { currentUser } = this;
    const topic = state.topic;
    let contents = []

    if (currentUser) {
      const username = currentUser.get('username');
      contents.push(
        avatarImg('large', {
          template: currentUser.get('avatar_template'),
          username: username
        }),
        h('div.handles', [
          h('h3', this.attach('link', {
            route: 'user',
            model: currentUser,
            className: 'user-activity-link',
            icon: 'user',
            rawLabel: username
          })),
          h('p', `@${username}`)
        ])
      )
    } else {
      var myString = Discourse.SiteSettings.widget_profile_guest_welcome_body;
  if(!state.cooked)
  {
    TextLib.cookAsync(myString).then(cooked => {
      contents.push(
        h('div.widget-header', Discourse.SiteSettings.widget_profile_guest_welcome_title),
        this.attach('button', {
          label: "sign_up",
         className: 'btn-primary sign-up-button',
         action: "sendShowCreateAccount"
          })
        )
                state.cookedData = cooked;
              state.cooked = true;
              self.scheduleRerender();
            });
  }else{
    contents.push(
        h('div.widget-header', Discourse.SiteSettings.widget_profile_guest_welcome_title),
         h('div.welcome-body', new RawHtml({ html: state.cookedData.string })),
        this.attach('button', {
          label: "sign_up",
         className: 'btn-primary sign-up-button',
         action: "sendShowCreateAccount"
          })
        );
  }
    }

    contents.push(h('hr'))

    if (topic) {
      if (currentUser && topic.details.can_invite_to) {
        contents.push(this.attach('button', {
          className: 'btn',
          label: 'topic.invite_reply.title',
          icon: 'envelope-o',
          action: 'showInvite'
        }))
      }
      contents.push(this.attach('button', {
        action: 'share',
        className: 'btn share',
        label: 'topic.share.title',
        icon: 'link',
        data: {
          'share-url': topic.get('shareUrl')
        }
      }))
      if (currentUser) {
        let tooltip = state.bookmarked ? 'bookmarks.created' : 'bookmarks.not_bookmarked';
        let label = state.bookmarked ? 'bookmarks.remove' : 'bookmarked.title';
        let buttonClass = 'btn bookmark';

        if (state.bookmarked) { buttonClass += ' bookmarked' }

        contents.push(
          this.attach('button', {
            action: 'toggleBookmark',
            title: tooltip,
            label: label,
            icon: 'bookmark',
            className: buttonClass
          }),
          this.attach('topic-notifications-button', {
            topic: topic,
            appendReason: true,
            showFullTitle: true
          })
        )
      } else {
        contents.push(this.attach('button', {
          className: 'btn',
          label: 'topic.reply.title',
          icon: 'reply',
          action: 'sendShowLogin'
        }))
      }
    } else {
      if (!this.site.mobileView && this.canInviteToForum()) {
        contents.push(this.attach('link', {
          route: 'userInvited',
          className: 'btn',
          icon: 'user-plus',
          label: 'user.invited.title',
          model: currentUser
        }))
      }
    }

    return h('div.widget-inner', contents);
  }

});
