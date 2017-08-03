import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';
import { avatarImg } from 'discourse/widgets/post';
import { cook } from 'discourse/lib/text';
import RawHtml from 'discourse/widgets/raw-html';
import { ajax } from 'discourse/lib/ajax';
import showModal from 'discourse/lib/show-modal';
import Composer from 'discourse/models/composer';
import TextLib from 'discourse/lib/text';
import { getOwner } from 'discourse-common/lib/get-owner';

export default createWidget('profile', {
  tagName: 'div.user-profile.widget-container',
  buildKey: (attrs) => 'user-profile',

  defaultState(attrs) {
    return {
      topic: attrs.topic,
      bookmarked: attrs.topic ? attrs.topic.bookmarked : null,
      loaded: false,
      minute: 0,
      hour: 0,
      cooked: false,
      cookedData: []
  }
},

canInviteToForum() {
    return Discourse.User.currentProp('can_invite_to_forum');
},

toggleBookmark() {
    this.state.bookmarked = !this.state.bookmarked;
    const topicController = this.register.lookup('controller:topic');
    topicController.send('toggleBookmark');
},
  createTopic() {
    const cController = this.register.lookup('controller:composer');
    const dtController = this.register.lookup('controller:discovery/topics');
    cController.open({
      categoryId: dtController.get('category.id'),
      action: Composer.CREATE_TOPIC,
      draftKey: dtController.get('model.draft_key'),
      draftSequence: dtController.get('model.draft_sequence')
    });
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
getReadTime(id){
    let self = this;
    self.state.loaded = true;
    ajax(`/discourseprofilewidget/data.json?user_id=${id}`).then(function(res){
        var credit = res.credit;
        var hours = Math.floor(Number(credit)/3600);
        credit = credit%(3600);
        var minutes = Math.floor(Number(credit)/60);
        if (minutes < 10 )
            minutes = `0${minutes}`;
        if (hours < 10)
            hours = `0${hours}`;

        self.state.minute = minutes;
        self.state.hour = hours;
        self.scheduleRerender();
    });

},

html(attrs, state) {
    let self = this;
    const { currentUser } = this;
    const topic = state.topic;
    let contents = []
    
    
    if (currentUser) {
      
      const username = currentUser.get('username');
      if(state.loaded == false)
      {
        var trust_level = currentUser.get('trust_level');
          this.getReadTime(currentUser.id);
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
          );
    }
    else
    {
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
            ]),
          h("div.credit", [
            h("span.credit-number", [h("span.hour_credit", {attributes: {title: I18n.t("main.hour")}}, `${state.hour}:`), h("span.minute_credit", {attributes: {title: I18n.t("main.minute")}}, `${state.minute}`)])])
          );
    }
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
            showFullTitle: false
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
  if(currentUser)
  {
    var trust_levell = currentUser.get('trust_level');
  if(!this.site.mobileView && trust_levell == 0)
    contents.push(this.attach("button",{
              className: "btn btn-default createTopic",
              label:"topic.create" ,
              icon: "plus",
              action: "createTopic",
              disabled: true,
              title: "main.cant_create_topic_button"
        
            }));
  else if(!this.site.mobileView && trust_levell > 0)
    contents.push(this.attach("button",{
              className: "btn btn-default createTopic",
              label:"topic.create" ,
              icon: "plus",
              action: "createTopic"
              }));
  }
  
  if (!this.site.mobileView && this.canInviteToForum()) {
    contents.push(this.attach('link', {
      route: 'userInvited',
      className: 'btn',
      icon: 'user-plus',
      label: 'user.invited.title',
      model: currentUser
  }))
}
  else if(!this.site.mobileView && trust_levell == 1)
   contents.push(this.attach('button', {
        route: 'userInvited',
        className: 'btn',
        icon: 'user-plus',
        label: 'user.invited.title',
        disabled: "true",
        title: "main.cant_invite_button"
   }))
}
  
return h('div.widget-inner', contents);
}

});
