module.exports = {
  users:[
    '_id', //
    'created_at', //
    'name',//
    'nickname',//
    //'total_videos_played',
    //'updated_at',
    'user_image', //
    'primary_email',
    'watch_later_broadcasts',
    'liked_broadcasts'
  ],
  broadcasts:[
    '_id', //
    'created_at', //
    //'updated_at',
    'video_originator_network_object_id',//
    //'total_plays',
    'watched_by_owner',//
    'liked_by_owner',//
    'name',//
    'description',//
    //'user_nickname',
    //'user_thumbnail',
    'video_id_at_provider',//
    'video_title',//
    //'video_description',
    'video_thumbnail_url',//
    'video_provider_name',//
    //'video_player',
    //'video_user_id',
    //'video_user_nickname',
    //'video_user_thumbnail',
    'video_originator_user_image',//
    //'video_originator_user_name',
    'video_originator_user_nickname',//
    //'channel_id',
    'user_id', //
    'video_origin',//
    'shortened_permalink',//
    'owner_watch_later'//
  ],
  channels:[
    '_id', //
    'created_at', //
    'updated_at',
    'name',//
    'public',//
    'user_id'
  ]
};
